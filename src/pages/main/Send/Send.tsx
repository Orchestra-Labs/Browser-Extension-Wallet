import { Select, SelectValue } from '@radix-ui/react-select';
import { Fragment, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { SigningStargateClient, calculateFee } from '@cosmjs/stargate';
import { getSigningOsmosisClient, osmosis } from '@orchestra-labs/symphonyjs';

import { ArrowLeft, LogoIcon, QRCode } from '@/assets/icons';
import { GREATER_EXPONENT_DEFAULT, ROUTES } from '@/constants';
import { cn } from '@/helpers/utils';
import { Button, Input, SelectContent, SelectItem, SelectSeparator, SelectTrigger } from '@/ui-kit';
import { useAtomValue } from 'jotai';
import { walletStateAtom } from '@/atoms';
import { Asset } from '@/types';
import { createOfflineSignerFromMnemonic, getSessionWallet } from '@/helpers';

const { swapSend } = osmosis.market.v1beta1.MessageComposer.withTypeUrl;

// TODO: add account selection after saving accounts
// const SELECT_ACCOUNT = [{ id: 'account1', name: 'MLD', balance: '1504 MLD' }];
// const avatarUrl = chrome?.runtime?.getURL('avatar.png');

// TODO: add send asset auto-selection if going through asset list on main page
export const Send = () => {
  console.log('send page');
  const walletState = useAtomValue(walletStateAtom);
  const walletAssets = walletState?.assets || [];
  // TODO: set selected asset to Asset object.
  const [recipientAddress, setRecipientAddress] = useState('');
  const [selectedAssetToSend, setSelectedAssetToSend] = useState('');
  const [selectedAssetToReceive, setSelectedAssetToReceive] = useState('');
  const [amount, setAmount] = useState('1000');

  const handleSend = async () => {
    console.log('Handling send...');
    const wallet = await getSessionWallet();
    const offlineSigner = await createOfflineSignerFromMnemonic(wallet?.mnemonic || '');
    console.log('Send page, Session wallet:', wallet);
    console.log('Send page, Wallet state', walletState);
    console.log('Send page, Offline Signer', offlineSigner);

    if (!wallet) {
      console.error('Wallet is locked or unavailable');
      return;
    }

    const assetToSend = walletAssets.find(a => a.denom === selectedAssetToSend);
    if (!assetToSend) {
      console.error('Selected asset to send not found in wallet assets.');
      return;
    }

    const adjustedAmount = (
      parseFloat(amount) * Math.pow(10, assetToSend.exponent || GREATER_EXPONENT_DEFAULT)
    ).toFixed(0); // No decimals, as this is sending the minor unit, not the greater.

    console.log('Adjusted amount:', adjustedAmount);

    try {
      if (selectedAssetToSend === selectedAssetToReceive) {
        // Perform a simple send transaction
        const sendMsg = {
          typeUrl: '/cosmos.bank.v1beta1.MsgSend',
          value: {
            fromAddress: walletState.address,
            toAddress: recipientAddress,
            amount: [{ denom: selectedAssetToSend, amount: adjustedAmount }],
          },
        };

        console.log('Send message:', sendMsg);

        // TODO: use query file
        console.log('Connecting to Stargate client...');
        const client = await SigningStargateClient.connectWithSigner(
          'https://symphony-rpc.kleomedes.network',
          wallet,
        );
        console.log('Stargate client connected.');

        // TODO: change gas and fee calculations
        // TODO: show max and min for gas fees, show actual amount taken for transaction fee.  from simulated send?
        const fee = calculateFee(100000, '0.0025note');
        console.log('Calculated fee:', fee);

        console.log('Signing and broadcasting transaction...');
        const result = await client.signAndBroadcast(walletState.address, [sendMsg], fee);
        console.log('Transaction result:', result);

        if (result.code === 0) {
          console.log('Transaction broadcasted successfully', result);
        } else {
          // TODO: show error to user
          console.error('Transaction failed:', result.code);
        }
      } else {
        // TODO: use query file
        // Perform a swap transaction
        const client = await getSigningOsmosisClient({
          rpcEndpoint: 'https://symphony-rpc.kleomedes.network',
          signer: offlineSigner,
        });

        const swapMsg = swapSend({
          fromAddress: walletState.address,
          toAddress: recipientAddress,
          offerCoin: {
            denom: selectedAssetToSend,
            amount: adjustedAmount,
          },
          askDenom: selectedAssetToReceive,
        });

        console.log('swapMsg details:', swapMsg);

        const gasAmount =
          selectedAssetToSend === 'note' || selectedAssetToReceive === 'note' ? '100000' : '350000';

        const result = await client.signAndBroadcast(walletState.address, [swapMsg], {
          amount: [{ denom: 'note', amount: '1000000' }],
          gas: gasAmount,
        });

        console.log('Transaction result:', result);

        if (result.code === 0) {
          console.log('Transaction broadcasted successfully', result);
        } else {
          console.error('Swap transaction failed:', result.code);
        }
      }
    } catch (error) {
      console.error('Error broadcasting transaction', error);
    }
  };

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
      <div className="flex flex-col justify-between flex-grow p-4 border border-neutral-2 rounded-lg mt-5 overflow-y-auto">
        {/* Address input */}
        <Input
          variant="primary"
          placeholder="Wallet Address or ICNS"
          icon={<QRCode width={20} />}
          value={recipientAddress}
          onChange={e => setRecipientAddress(e.target.value)}
          className="text-white mb-4"
        />

        {/* Send Asset selection */}
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm text-neutral-1">Send As</label>
          <Select defaultValue="" onValueChange={value => setSelectedAssetToSend(value)}>
            <SelectTrigger className="max-w-56 py-2.5">
              <SelectValue placeholder="Asset to Send" />
            </SelectTrigger>
            <SelectContent>
              {walletAssets.map((asset: Asset, index, array) => (
                <Fragment key={asset.denom}>
                  <SelectItem value={asset.denom}>
                    <div className="flex items-center text-left">
                      <div className="rounded-full w-7 h-7 bg-neutral-2 p-2 flex items-center justify-center">
                        <LogoIcon />
                      </div>
                      <div className="flex flex-col ml-3">
                        <p className="text-base text-white">{asset.symbol}</p>
                      </div>
                    </div>
                  </SelectItem>
                  {index + 1 !== array.length && <SelectSeparator />}
                </Fragment>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Receive Asset selection */}
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm text-neutral-1">Receive As</label>
          <Select defaultValue="" onValueChange={value => setSelectedAssetToReceive(value)}>
            <SelectTrigger className="max-w-56 py-2.5">
              <SelectValue placeholder="Asset to Receive" />
            </SelectTrigger>
            <SelectContent>
              {walletAssets.map((asset: Asset, index, array) => (
                <Fragment key={asset.denom}>
                  <SelectItem value={asset.denom}>
                    <div className="flex items-center text-left">
                      <div className="rounded-full w-7 h-7 bg-neutral-2 p-2 flex items-center justify-center">
                        <LogoIcon />
                      </div>
                      <div className="flex flex-col ml-3">
                        <p className="text-base text-white">{asset.symbol}</p>
                      </div>
                    </div>
                  </SelectItem>
                  {index + 1 !== array.length && <SelectSeparator />}
                </Fragment>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Amount input */}
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm text-neutral-1">Amount</label>
          <Input
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className={cn(
              'p-2.5 bg-neutral-2 text-white border border-neutral-2 rounded-md max-w-56 w-full h-10',
              'hover:border-neutral-1',
              'focus:outline-0 focus:border-blue focus:text-white',
            )}
          />
        </div>

        {/* Fee */}
        <div className="flex justify-between items-center text-blue text-sm font-bold">
          <p>Fee</p>
          <p>0.0004 MLD</p>
        </div>

        {/* Send Button */}
        <div className="mt-8">
          <Button className="w-full" onClick={handleSend}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};
