import React, { useState } from 'react';
import { useAtomValue } from 'jotai';
import { walletStateAtom } from '@/atoms';
import { Button, CopyTextField, SlideTray } from '@/ui-kit';
import { truncateWalletAddress } from '@/helpers';
import { DEFAULT_ASSET, WALLET_PREFIX } from '@/constants';
import { QRCodeContainer } from '../QRCodeContainer';

export const ReceiveDialog: React.FC = () => {
  const walletState = useAtomValue(walletStateAtom);

  const [includeCoinPreference, setIncludeCoinPreference] = useState(false);

  const walletAddress = walletState.address;
  const walletDisplayAddress = truncateWalletAddress(WALLET_PREFIX, walletAddress);

  const qrDataWithAddress = JSON.stringify({
    address: walletAddress,
    denomPreference: DEFAULT_ASSET.denom,
  });
  const qrData = includeCoinPreference ? qrDataWithAddress : walletAddress;

  return (
    <SlideTray
      triggerComponent={
        <Button variant="secondary" className="w-full">
          Receive
        </Button>
      }
      title="Copy Address"
      showBottomBorder
      reducedTopMargin
    >
      <div className="flex flex-col items-center">
        <div className="mb-2">
          Maestro only:{' '}
          <Button
            variant={!includeCoinPreference ? 'unselected' : 'selectedEnabled'}
            size="small"
            onClick={() => setIncludeCoinPreference(!includeCoinPreference)}
            className="px-2 rounded-md text-xs"
          >
            {`${includeCoinPreference ? 'Remove' : 'Include'} coin preference`}
          </Button>
        </div>

        <QRCodeContainer qrCodeValue={qrData} />

        {/* Wallet Address */}
        <CopyTextField
          variant="transparent"
          displayText={walletDisplayAddress}
          copyText={walletAddress}
          iconHeight={16}
        />
      </div>
    </SlideTray>
  );
};
