import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowLeft, Spinner, Swap } from '@/assets/icons';
import { DEFAULT_ASSET, GREATER_EXPONENT_DEFAULT, ROUTES } from '@/constants';
import { Button, Separator } from '@/ui-kit';
import { useAtom, useAtomValue } from 'jotai';
import {
  callbackChangeMapAtom,
  changeMapAtom,
  recipientAddressAtom,
  receiveStateAtom,
  sendStateAtom,
  walletStateAtom,
  selectedAssetAtom,
  addressVerifiedAtom,
} from '@/atoms';
import { Asset, TransactionResult, TransactionSuccess } from '@/types';
import { AssetInput, WalletSuccessScreen } from '@/components';
import {
  // cn,
  formatBalanceDisplay,
  removeTrailingZeroes,
  sendTransaction,
  swapTransaction,
} from '@/helpers';
import { loadingAtom } from '@/atoms/loadingAtom';
import { useExchangeRate, useRefreshData } from '@/hooks/';
import { AddressInput } from './AddressInput';

export const Send = () => {
  const { refreshData } = useRefreshData();

  const walletState = useAtomValue(walletStateAtom);
  const walletAssets = walletState?.assets || [];

  const [sendState, setSendState] = useAtom(sendStateAtom);
  const [receiveState, setReceiveState] = useAtom(receiveStateAtom);
  const [changeMap, setChangeMap] = useAtom(changeMapAtom);
  const [callbackChangeMap, setCallbackChangeMap] = useAtom(callbackChangeMapAtom);
  const [isLoading, setLoading] = useAtom(loadingAtom);
  const [recipientAddress, setRecipientAddress] = useAtom(recipientAddressAtom);
  const addressVerified = useAtomValue(addressVerifiedAtom);
  const [selectedAsset, setSelectedAsset] = useAtom(selectedAssetAtom);

  // TODO: only query for exchange rate on transaction type swap
  const { exchangeRate } = useExchangeRate();

  // TODO: handle bridge types such as IBC
  const [transactionType, setTransactionType] = useState({
    isSwap: false,
    isValid: true,
  });
  const [simulatedFee, setSimulatedFee] = useState<{
    fee: string;
    textClass: 'text-error' | 'text-warn' | 'text-blue';
  } | null>({ fee: '0 MLD', textClass: 'text-blue' });
  const [sendPlaceholder, setSendPlaceholder] = useState<string>('');
  const [receivePlaceholder, setReceivePlaceholder] = useState<string>('');
  // const [transactionMessage, setTransactionMessage] = useState<string>('');
  const [transactionState, setTransactionState] = useState<TransactionSuccess>({
    isSuccess: false,
  });

  const handleTransaction = async ({ simulateTransaction = false } = {}) => {
    console.log('Starting handleTransaction');
    console.log('transactionType.isValid:', transactionType.isValid);

    if (!transactionType.isValid) return;

    let currentRecipientAddress = '';
    if (!addressVerified || !recipientAddress) {
      currentRecipientAddress = walletState.address;
    } else {
      currentRecipientAddress = recipientAddress;
    }

    console.log('Recipient address:', currentRecipientAddress);
    if (!currentRecipientAddress) return;

    const sendAsset = sendState.asset;
    const sendAmount = sendState.amount;
    const receiveAsset = receiveState.asset;

    console.log('sendAsset:', sendAsset);
    console.log('receiveAsset:', receiveAsset);

    if (!sendAsset || !receiveAsset) return;

    const assetToSend = walletAssets.find(a => a.denom === sendAsset.denom);
    console.log('assetToSend:', assetToSend);
    if (!assetToSend) return;

    const adjustedAmount = (
      sendAmount * Math.pow(10, assetToSend.exponent || GREATER_EXPONENT_DEFAULT)
    ).toFixed(0); // No decimals, minor unit

    console.log('Adjusted amount:', adjustedAmount);

    const sendObject = {
      recipientAddress: currentRecipientAddress,
      amount: adjustedAmount,
      denom: sendAsset.denom,
    };

    console.log('sendObject:', sendObject);

    if (!simulateTransaction) {
      console.log('Setting loading state');
      setLoading(true);
    }

    try {
      let result: TransactionResult;
      // Routing logic based on transactionType
      console.log('transaction type', transactionType.isSwap);

      if (!transactionType.isSwap) {
        console.log('Executing sendTransaction');
        result = await sendTransaction(walletState.address, sendObject, simulateTransaction);
        console.log('sendTransaction result:', result);
      } else if (transactionType.isSwap) {
        const swapObject = { sendObject, resultDenom: receiveAsset.denom };
        console.log('Executing swapTransaction with swapObject:', swapObject);
        result = await swapTransaction(walletState.address, swapObject, simulateTransaction);
        console.log('swapTransaction result:', result);
      } else {
        throw new Error('Invalid transaction type');
      }

      console.log('Result data:', simulateTransaction, result?.data?.code);

      // Process result for simulation or actual transaction
      if (simulateTransaction && result?.data?.code === 0) {
        console.log('Simulation successful');
        return result;
      } else if (result.success && result.data?.code === 0) {
        // TODO: much like on validator actions, set to toast if not on page.  useLocation?
        // toast({
        //   title: `${transactionType} success!`,
        //   description: `Transaction hash ${displayTransactionHash} has been copied.`,
        // });
        setTransactionState({ isSuccess: true, txHash: result.data.txHash });
      } else {
        console.error('Transaction failed:', result.data);
      }
    } catch (error) {
      console.error('Error in transaction handling:', error);
    } finally {
      if (!simulateTransaction) {
        console.log('Resetting loading state');
        setLoading(false);
      }
    }

    console.log('Ending handleTransaction function');
    // TODO: also put refetch after the stake and unstake functions
    // TODO: re-apply refetch if helpers are changed into hooks
    // refetch();
    return null;
  };

  const calculateMaxAvailable = (sendAsset: Asset) => {
    const walletAsset = walletAssets.find(asset => asset.denom === sendAsset.denom);
    if (!walletAsset) return 0;

    const maxAmount = parseFloat(walletAsset.amount || '0');
    console.log('simulated fee', simulatedFee ? parseFloat(simulatedFee.fee) : 0);
    console.log(
      'alternative representation',
      simulatedFee ? parseFloat(simulatedFee.fee.split(' ')[0]) : 0,
    );
    const feeAmount = simulatedFee ? parseFloat(simulatedFee.fee) : 0;

    const maxAvailable = Math.max(0, maxAmount - feeAmount);
    return maxAvailable;
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

  const updateFee = async () => {
    const simulationResponse = await handleTransaction({ simulateTransaction: true });
    console.log('simulationResponse', simulationResponse, simulationResponse?.data);

    if (simulationResponse && simulationResponse.data) {
      const gasWanted = parseInt(simulationResponse.data.gasWanted || '0', 10);
      console.log('gas wanted', simulationResponse.data.gasWanted, gasWanted);

      // TODO; get default gas price from chain registry
      const defaultGasPrice = 0.025;
      const exponent = sendState.asset?.exponent || GREATER_EXPONENT_DEFAULT;
      const symbol = sendState.asset.symbol || DEFAULT_ASSET.symbol || 'MLD';
      const feeAmount = gasWanted * defaultGasPrice;
      const feeInGreaterUnit = feeAmount / Math.pow(10, exponent);

      const feePercentage = feeInGreaterUnit ? (feeInGreaterUnit / sendState.amount) * 100 : 0;

      setSimulatedFee({
        fee: formatBalanceDisplay(feeInGreaterUnit.toFixed(exponent), symbol),
        textClass:
          feePercentage > 1 ? 'text-error' : feePercentage > 0.75 ? 'text-warn' : 'text-blue',
      });
    } else {
      // TODO: handle error on fee return
      console.log('Simulation did not return gas details');
    }
  };

  const updateTransactionType = () => {
    const sendAsset = sendState.asset;
    const receiveAsset = receiveState.asset;

    if (!sendAsset || !receiveAsset) return;

    let newTransactionType = {
      isSwap: false,
      isValid: true,
    };

    if (sendAsset.denom === receiveAsset.denom) {
      newTransactionType.isSwap = false;
      // setTransactionMessage(`Sending ${sendAsset.symbol} through Symphony.`);
    } else if (!sendAsset.isIbc && !receiveAsset.isIbc && sendAsset.denom !== receiveAsset.denom) {
      newTransactionType.isSwap = true;
      // setTransactionMessage(
      //   newTransactionType.isValid
      //     ? `Sending ${sendAsset.symbol} into ${receiveAsset.symbol} on Symphony.`
      //     : `No exchange on current pair`,
      // );
    } else {
      newTransactionType.isValid = false;
      // setTransactionMessage('Not yet supported');
    }

    setTransactionType(newTransactionType);

    // Update send and receive placeholders based on max values and exchange rate
    const maxSendable = calculateMaxAvailable(sendAsset);
    const applicableExchangeRate = sendAsset.denom === receiveAsset.denom ? 1 : exchangeRate || 1;
    const maxReceivable = maxSendable * applicableExchangeRate;

    setSendPlaceholder(`Max: ${formatBalanceDisplay(`${maxSendable}`, sendAsset.symbol || 'MLD')}`);
    setReceivePlaceholder(
      !newTransactionType.isSwap
        ? 'No exchange on current pair'
        : `Max: ${removeTrailingZeroes(maxReceivable)}${receiveAsset.symbol}`,
    );
  };

  const propagateChanges = (
    map = changeMap,
    setMap = setChangeMap,
    isExchangeRateUpdate = false,
  ) => {
    if (map.sendAsset) {
      const sendAsset = sendState.asset;
      const sendAmount = sendState.amount;
      if (!sendAsset) return;

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
      if (!sendAsset) return;

      const sendAmount = sendState.amount;
      const maxAvailable = calculateMaxAvailable(sendAsset);
      const verifiedSendAmount = Math.min(sendState.amount, maxAvailable);

      if (verifiedSendAmount != sendAmount) {
        updateSendAmount(verifiedSendAmount);
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
      if (!sendAsset) return;

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

    // TODO: add fee update to changemap?
    updateFee();
    updateTransactionType();
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

  const resetStates = () => {
    setSendState({
      asset: DEFAULT_ASSET,
      amount: 0,
    });
    setReceiveState({
      asset: DEFAULT_ASSET,
      amount: 0,
    });
    setRecipientAddress('');
    setSelectedAsset(DEFAULT_ASSET);
  };

  useEffect(() => {
    propagateChanges();
  }, [changeMap]);

  // Update on late exchangeRate returns
  useEffect(() => {
    propagateChanges(callbackChangeMap, setCallbackChangeMap, true);
  }, [exchangeRate]);

  useEffect(() => {
    if (transactionState.isSuccess) {
      refreshData({ wallet: true });
    }
  }, [transactionState.isSuccess]);

  useEffect(() => {
    updateSendAsset(selectedAsset);
    updateReceiveAsset(selectedAsset);
    updateTransactionType();

    return () => {
      // Reset the states when the component is unmounted (user leaves the page)
      resetStates();
    };
  }, []);

  if (transactionState.isSuccess) {
    return <WalletSuccessScreen caption="Transaction success!" txHash={transactionState.txHash} />;
  }

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
        <div>
          <h1 className="text-h5 text-white font-bold">Send</h1>
          {/* TODO: remove if remains unused.  potential spot for info and error messages */}
          {/* <div className={cn(`${transactionType.isValid ? 'text-neutral-1' : 'text-error'}`)}>
            {transactionMessage}
          </div> */}
        </div>
        <div className="max-w-5 w-full max-h-5" />
      </div>

      {/* Content container */}
      <div className="flex flex-col justify-between flex-grow p-4 border border-neutral-2 rounded-lg overflow-y-auto">
        <>
          {/* Address Input */}
          <AddressInput addBottomMargin={false} updateSendAsset={updateSendAsset} />

          {/* Separator */}
          <Separator variant="top" />

          {/* Send Section */}
          <AssetInput
            placeholder={sendPlaceholder}
            variant="send"
            assetState={sendState.asset}
            amountState={sendState.amount}
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
            placeholder={receivePlaceholder}
            variant="receive"
            assetState={receiveState.asset}
            amountState={receiveState.amount}
            updateAsset={updateReceiveAsset}
            updateAmount={updateReceiveAmount}
          />
        </>

        {/* Fee Section */}
        <div className="flex flex-grow" />
        <div className="flex justify-between items-center text-blue text-sm font-bold">
          <p>Fee</p>
          <p className={simulatedFee?.textClass}>
            {simulatedFee && sendState.amount !== 0 ? simulatedFee?.fee : '-'}
          </p>
        </div>

        {/* Separator */}
        <div className="mt-2">
          <Separator variant="top" />

          {/* Send Button */}
          <Button
            className="w-full"
            onClick={() => handleTransaction()}
            disabled={isLoading || sendState.amount === 0}
          >
            {isLoading ? <Spinner className="h-8 w-8 animate-spin fill-blue" /> : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
};
