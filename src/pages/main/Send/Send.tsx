import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ArrowLeft, QRCode, Swap } from '@/assets/icons';
import { DEFAULT_ASSET, GREATER_EXPONENT_DEFAULT, ROUTES } from '@/constants';
import { cn } from '@/helpers/utils';
import { Button, Input, Separator } from '@/ui-kit';
import { useAtomValue } from 'jotai';
import { walletStateAtom } from '@/atoms';
import { Asset, TransactionResult } from '@/types';
import { getSessionToken, sendTransaction, swapTransaction} from '@/helpers';
import { AssetSelectDialog, WalletSuccessScreen } from '@/components';


export const Send = () => {
  const location = useLocation();
  const selectedSendAsset = location.state?.selectedSendAsset;

  const walletState = useAtomValue(walletStateAtom);
  const walletAssets = walletState?.assets || [];
  const [recipientAddress, setRecipientAddress] = useState('');
  const [sendAsset, setSendAsset] = useState<Asset | null>(selectedSendAsset || DEFAULT_ASSET);
  const [receiveAsset, setReceiveAsset] = useState<Asset | null>(
    selectedSendAsset || DEFAULT_ASSET,
  );
  const [sendAmount, setSendAmount] = useState('1');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [alert, setAlert] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  //alert config for tx success/fail
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert(null);
      }, 5000); // Hide alert after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [alert]);

  const [isSuccess, setIsSuccess] = useState(false);

  const handleSend = async () => {
    console.log('Handling send...');
    const sessionToken = getSessionToken();
    console.log('Send page, Session token:', sessionToken);
    console.log('Send page, Wallet state', walletState);
    console.log('send asset', sendAsset);
    if (!sendAsset) return;
    const assetToSend = walletAssets.find(a => a.denom === sendAsset.denom);
    if (!assetToSend) return;
    console.log(assetToSend)
    const adjustedAmount = (
      parseFloat(sendAmount) * Math.pow(10, assetToSend.exponent || GREATER_EXPONENT_DEFAULT)
    ).toFixed(0); // No decimals, as this is sending the minor unit, not the greater.

    console.log('Adjusted amount:', adjustedAmount);

    const sendObject = {
      recipientAddress,
      amount: adjustedAmount,
      denom: sendAsset.denom,
    };

    try {
      let result: TransactionResult;
      if (sendAsset === receiveAsset) {
        result = await sendTransaction(walletState.address, sendObject);
        // TODO: change gas and fee calculations
        // TODO: show max and min for gas fees, show actual amount taken for transaction fee.  from simulated send?
        // Set success state to true after transaction
        setIsSuccess(true);
      } else if (receiveAsset) {
        // Swap transaction
        const swapObject = { sendObject, resultDenom: receiveAsset.denom };
        result = await swapTransaction(walletState.address, swapObject);
                setIsSuccess(true);
      } else {
        throw new Error('Invalid asset configuration');
      }

      setAlert({
        type: result.success ? 'success' : 'error',
        message: result.message,
      });

      if (!result.success) {
        console.error('Detailed error:', result.data);
      }
    } catch (error) {
      console.error('Error broadcasting transaction', error);
      setAlert({
        type: 'error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
      });
    }
  };
  

  if (isSuccess) {
    return <WalletSuccessScreen caption="Transaction success!" />;
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
        <h1 className="text-h5 text-white font-bold">Send</h1>
        <div className="max-w-5 w-full max-h-5" />
      </div>

      {/* Content container */}
      <div className="flex flex-col justify-between flex-grow p-4 border border-neutral-2 rounded-lg overflow-y-auto">
        {/* Address Input */}
        <div className="">
          <div className="flex items-center mb-4 space-x-2">
            <label className="text-sm text-neutral-1 whitespace-nowrap">Send to:</label>
            <div className="flex-grow">
              <Input
                variant="primary"
                placeholder="Wallet Address or ICNS"
                icon={
                  <QRCode
                    className="h-7 w-7 text-neutral-1 hover:bg-blue-hover hover:text-blue-dark cursor-pointer"
                    width={20}
                  />
                }
                value={recipientAddress}
                onChange={e => setRecipientAddress(e.target.value)}
                className="text-white w-full"
              />
            </div>
          </div>

          {/* Separator */}
          <Separator variant="top" />

          {/* Send Section */}
          <div className="flex items-center mb-4 space-x-2">
            <label className="text-sm text-neutral-1 whitespace-nowrap">Sending:</label>
            <div className="flex-grow">
              <Input
                variant="primary"
                value={sendAmount}
                onChange={e => setSendAmount(e.target.value)}
                icon={
                  <AssetSelectDialog
                    selectedAsset={sendAsset}
                    isSendDialog={true}
                    onClick={setSendAsset}
                  />
                }
                className={cn('p-2.5 text-white border border-neutral-2 rounded-md w-full h-10')}
              />
            </div>
          </div>

          {/* Separator with reverse icon */}
          <div className="flex justify-center my-4">
            <Button className="rounded-md h-9 w-9 bg-neutral-3" onClick={() => {}}>
              <Swap />
            </Button>
          </div>

          {/* Receive Section */}
          <div className="flex items-center mb-4 space-x-2">
            <label className="text-sm text-neutral-1 whitespace-nowrap">Receiving:</label>
            <div className="flex-grow">
              <Input
                variant="primary"
                value={receiveAmount}
                onChange={e => setReceiveAmount(e.target.value)}
                icon={
                  <AssetSelectDialog
                    selectedAsset={receiveAsset}
                    isSendDialog={false}
                    onClick={setReceiveAsset}
                  />
                }
                className={cn('p-2.5 text-white border border-neutral-2 rounded-md w-full h-10')}
              />
            </div>
          </div>
        </div>

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
          <Button className="w-full" onClick={handleSend}>
            Send
          </Button>
        </div>

              {/* Tailwind CSS Alert */}
      {alert && (
        <div className={`fixed bottom-4 left-4 right-4 p-4 rounded-md ${
          alert.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white shadow-lg transition-opacity duration-500 ease-in-out`}>
          <div className="flex justify-between items-center">
            <span>{alert.message}</span>
            <button 
              onClick={() => setAlert(null)}
              className="text-white hover:text-gray-200 focus:outline-none"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  </div>



  );
};
