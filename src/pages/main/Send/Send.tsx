import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ArrowLeft, Spinner, Swap } from '@/assets/icons';
import { DEFAULT_ASSET, GREATER_EXPONENT_DEFAULT, LOCAL_ASSET_REGISTRY, ROUTES } from '@/constants';
import { Button, Separator } from '@/ui-kit';
import { useAtom, useAtomValue } from 'jotai';
import {
  callbackChangeMapAtom,
  changeMapAtom,
  recipientAddressAtom,
  receiveStateAtom,
  sendStateAtom,
  walletStateAtom,
} from '@/atoms';
import { Asset } from '@/types';
import { removeTrailingZeroes, sendTransaction, swapTransaction } from '@/helpers';
import { WalletSuccessScreen } from '@/components';
import { loadingAtom } from '@/atoms/loadingAtom';
import { useExchangeRate } from '@/hooks/';
import { AssetInput } from './AssetInput';
import { AddressInput } from './AddressInput';

export const Send = () => {
  const location = useLocation();
  const selectedSendAsset = location.state?.selectedSendAsset || DEFAULT_ASSET;

  const walletState = useAtomValue(walletStateAtom);
  const walletAssets = walletState?.assets || [];
  const [sendState, setSendState] = useAtom(sendStateAtom);
  const [receiveState, setReceiveState] = useAtom(receiveStateAtom);
  const [changeMap, setChangeMap] = useAtom(changeMapAtom);
  const [callbackChangeMap, setCallbackChangeMap] = useAtom(callbackChangeMapAtom);
  const [isLoading, setLoading] = useAtom(loadingAtom);
  const recipientAddress = useAtomValue(recipientAddressAtom);

  const { exchangeRate } = useExchangeRate();

  const [isSuccess, setIsSuccess] = useState(false);

  // TODO: write and enable function
  // const checkTransactionType = () => {
  // regular transaction
  // swap transaction
  // ibc (cross-chain transaction)
  // ibc and swap transaction (change both asset and chain)
  // };

  const handleSend = async () => {
    const sendAsset = sendState.asset;
    const sendAmount = sendState.amount;
    const receiveAsset = receiveState.asset;

    if (!sendAsset) return;
    const assetToSend = walletAssets.find(a => a.denom === sendAsset.denom);
    if (!assetToSend) return;

    const adjustedAmount = (
      sendAmount * Math.pow(10, assetToSend.exponent || GREATER_EXPONENT_DEFAULT)
    ).toFixed(0); // No decimals, as this is sending the minor unit, not the greater.

    const sendObject = {
      recipientAddress,
      amount: adjustedAmount,
      denom: sendAsset.denom,
    };

    setLoading(true);

    try {
      if (sendAsset === receiveAsset) {
        // Send transaction
        await sendTransaction(walletState.address, sendObject);
        // Set success state to true after transaction
        setIsSuccess(true);
      } else if (receiveAsset) {
        // Swap transaction
        const swapObject = { sendObject, resultDenom: receiveAsset.denom };
        await swapTransaction(walletState.address, swapObject);
        // Set success state to true after swap
        setIsSuccess(true);
      }
    } catch (error) {
      console.error('Error broadcasting transaction', error);
    }
    // TODO: also put refetch after the stake and unstake functions
    // TODO: re-apply refetch if helpers are changed into hooks
    // refetch();
    setLoading(false);
  };

  const calculateMaxAvailable = (sendAsset: Asset) => {
    // Find the wallet asset that matches the send asset's denom
    const walletAsset = walletAssets.find(asset => asset.denom === sendAsset.denom);
    if (!walletAsset) {
      return 0;
    }

    const maxAmount = parseFloat(walletAsset?.amount ?? '0');
    return maxAmount;
  };

  const updateSendAsset = (newAsset: Asset, propagateChanges: boolean = false) => {
    setSendState(prevState => ({
      ...prevState,
      asset: {
        ...newAsset,
      },
    }));

    if (propagateChanges) {
      setChangeMap(prevMap => ({ ...prevMap, sendAsset: true }));
      setCallbackChangeMap({
        sendAsset: true,
        receiveAsset: false,
        sendAmount: false,
        receiveAmount: false,
      });
    }
  };

  const updateReceiveAsset = (newAsset: Asset, propagate: boolean = false) => {
    setReceiveState(prevState => ({
      ...prevState,
      asset: {
        ...newAsset,
      },
    }));

    if (propagate) {
      setChangeMap(prevMap => ({
        ...prevMap,
        receiveAsset: true,
      }));
      setCallbackChangeMap({
        sendAsset: false,
        receiveAsset: true,
        sendAmount: false,
        receiveAmount: false,
      });
    }
  };

  const updateSendAmount = (newSendAmount: number, propagateChanges: boolean = false) => {
    const sendAsset = sendState.asset;
    if (!sendAsset) {
      return;
    }

    const exponent = sendAsset.exponent ?? GREATER_EXPONENT_DEFAULT;
    const roundedSendAmount = parseFloat(newSendAmount.toFixed(exponent));

    // Update the sendState with the new rounded amount
    setSendState(prevState => {
      return {
        ...prevState,
        amount: roundedSendAmount,
      };
    });

    // Handle propagation of changes if required
    if (propagateChanges) {
      setChangeMap(prevMap => ({
        ...prevMap,
        sendAmount: true,
      }));

      setCallbackChangeMap({
        sendAsset: false,
        receiveAsset: false,
        sendAmount: true,
        receiveAmount: false,
      });
    }
  };

  const updateReceiveAmount = (newReceiveAmount: number, propagateChanges: boolean = false) => {
    const receiveAsset = receiveState.asset;
    if (!receiveAsset) return;

    const exponent = receiveAsset.exponent ?? GREATER_EXPONENT_DEFAULT;
    const roundedReceiveAmount = parseFloat(newReceiveAmount.toFixed(exponent));

    setReceiveState(prevState => ({
      ...prevState,
      amount: roundedReceiveAmount,
    }));

    if (propagateChanges) {
      setChangeMap(prevMap => ({
        ...prevMap,
        receiveAmount: true,
      }));
      setCallbackChangeMap({
        sendAsset: false,
        receiveAsset: false,
        sendAmount: false,
        receiveAmount: true,
      });
    }
  };

  const propagateChanges = (
    map = changeMap,
    setMap = setChangeMap,
    isExchangeRateUpdate = false,
  ) => {
    if (map.sendAsset) {
      const sendAsset = sendState.asset;
      const sendAmount = sendState.amount;

      if (sendAsset == null) {
        return;
      }

      const maxAvailable = calculateMaxAvailable(sendAsset);

      if (sendAmount > maxAvailable) {
        const newSendAmount = maxAvailable;
        const newReceiveAmount = newSendAmount * (exchangeRate || 1);

        updateSendAmount(newSendAmount);
        updateReceiveAmount(newReceiveAmount);
      } else {
        const newReceiveAmount = sendAmount * (exchangeRate || 1);
        updateReceiveAmount(newReceiveAmount);
      }

      if (!isExchangeRateUpdate) {
        setMap(prevMap => ({ ...prevMap, sendAsset: false }));
      }
    }

    if (map.receiveAsset) {
      const sendAmount = sendState.amount;
      const newReceiveAmount = sendAmount * (exchangeRate || 1);

      updateReceiveAmount(newReceiveAmount);

      if (!isExchangeRateUpdate) {
        setMap(prevMap => ({ ...prevMap, receiveAsset: false }));
      }
    }

    if (map.sendAmount) {
      const sendAsset = sendState.asset;

      if (!sendAsset) {
        return;
      }

      const sendAmount = sendState.amount;
      const maxAvailable = calculateMaxAvailable(sendAsset);

      let verifiedSendAmount = sendAmount > maxAvailable ? maxAvailable : sendAmount;

      if (sendAmount > maxAvailable) {
        updateSendAmount(maxAvailable);
        verifiedSendAmount = maxAvailable;
      }

      const applicableExchangeRate =
        sendAsset.denom === receiveState.asset?.denom ? 1 : exchangeRate || 1;
      const newReceiveAmount = verifiedSendAmount * applicableExchangeRate;

      updateReceiveAmount(newReceiveAmount);

      if (!isExchangeRateUpdate) {
        setMap(prevMap => ({ ...prevMap, sendAmount: false }));
      }
    }

    if (map.receiveAmount) {
      const sendAsset = sendState.asset;

      if (!sendAsset) {
        return;
      }

      const receiveAmount = receiveState.amount;

      const applicableExchangeRate =
        sendAsset.denom === receiveState.asset?.denom ? 1 : 1 / (exchangeRate || 1);
      let newSendAmount = receiveAmount * applicableExchangeRate;

      const maxAvailable = calculateMaxAvailable(sendAsset);

      if (newSendAmount > maxAvailable) {
        newSendAmount = maxAvailable;
        const adjustedReceiveAmount = newSendAmount * (exchangeRate || 1);

        updateSendAmount(newSendAmount);
        updateReceiveAmount(adjustedReceiveAmount);
      } else {
        updateSendAmount(newSendAmount);
      }

      if (!isExchangeRateUpdate) {
        setMap(prevMap => ({ ...prevMap, receiveAmount: false }));
      }
    }
  };

  const switchFields = () => {
    const sendAsset = sendState.asset as Asset;
    const receiveAsset = receiveState.asset as Asset;
    const receiveAmount = receiveState.amount;

    if (sendAsset.denom !== receiveAsset.denom) {
      updateReceiveAsset(sendAsset);
      updateSendAmount(receiveAmount);
      updateSendAsset(receiveAsset, true);
    }
  };

  useEffect(() => {
    propagateChanges();
  }, [changeMap]);

  // Update on late exchangeRate returns
  useEffect(() => {
    propagateChanges(callbackChangeMap, setCallbackChangeMap, true);
  }, [exchangeRate]);

  useEffect(() => {
    updateSendAsset(selectedSendAsset);
    updateReceiveAsset(selectedSendAsset);
  }, [selectedSendAsset]);

  if (isSuccess) {
    return <WalletSuccessScreen caption="Transaction success!" />;
  }

  const isNotSwappable =
    sendState.asset?.denom === receiveState.asset?.denom ||
    (receiveState.asset?.isIbc && receiveState.asset.denom != LOCAL_ASSET_REGISTRY.note.denom) ||
    (sendState.asset?.isIbc && sendState.asset.denom != LOCAL_ASSET_REGISTRY.note.denom);

  const sendAsset = sendState.asset || DEFAULT_ASSET;
  const receiveAsset = receiveState.asset || DEFAULT_ASSET;
  const maxSendable = calculateMaxAvailable(sendAsset);
  const applicableExchangeRate = sendAsset.denom === receiveAsset.denom ? 1 : exchangeRate || 1;
  const maxReceivable = maxSendable * applicableExchangeRate;
  const sendPlaceholder = `Max: ${removeTrailingZeroes(maxSendable)}${sendAsset.symbol}`;
  const receivePlaceholder = isNotSwappable
    ? 'No exchange on current pair'
    : `Max: ${removeTrailingZeroes(maxReceivable)}${receiveAsset.symbol}`;

  return (
    <div className="h-screen flex flex-col bg-black text-white">
      {/* Top bar with back button and title */}
      <div className="flex justify-between items-center w-full p-5">
        <NavLink
          to={ROUTES.APP.ROOT}
          className="flex items-center justify-center max-w-5 max-h-5 p-0.5"
        >
          <ArrowLeft className="w-full h-full text-white" />
        </NavLink>
        <h1 className="text-h5 text-white font-bold">Send</h1>
        <div className="max-w-5 w-full max-h-5" />
      </div>

      {/* Content container */}
      <div className="flex flex-col justify-between flex-grow p-4 border border-neutral-2 rounded-lg overflow-y-auto">
        <>
          {/* Address Input */}
          <AddressInput />

          {/* Separator */}
          <Separator variant="top" />

          {/* Send Section */}
          <AssetInput
            currentState={sendState}
            placeholder={sendPlaceholder}
            updateAsset={updateSendAsset}
            updateAmount={updateSendAmount}
          />

          {/* Separator with reverse icon */}
          <div className="flex justify-center my-4">
            <Button className="rounded-md h-9 w-9 bg-neutral-3" onClick={switchFields}>
              <Swap />
            </Button>
          </div>

          {/* Receive Section */}
          <AssetInput
            isReceiveInput={true}
            isDisabled={isNotSwappable}
            currentState={receiveState}
            placeholder={receivePlaceholder}
            updateAsset={updateReceiveAsset}
            updateAmount={updateReceiveAmount}
          />
        </>

        <div className="flex flex-grow" />

        {/* Fee Section */}
        <div className="flex justify-between items-center text-blue text-sm font-bold">
          <p>Fee</p>
          <p>0.0004 MLD</p>
        </div>

        {/* Separator */}
        <div className="mt-2">
          <Separator variant="top" />

          {/* Send Button */}
          <Button className="w-full" onClick={handleSend} disabled={isLoading}>
            {/* TODO: pick between spinner and loader end ensure classNames are correct */}
            {isLoading ? <Spinner className="w-5 h-5 text-white animate-spin" /> : 'Send'}
            {/* {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader backgroundClass="inherit" />
              </div>
            )} */}
          </Button>
        </div>
      </div>
    </div>
  );
};
