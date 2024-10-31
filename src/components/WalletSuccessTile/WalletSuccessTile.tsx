import React from 'react';
import { VerifySuccess } from '@/assets/icons';
import { CopyTextField } from '@/ui-kit';
import { cn, truncateWalletAddress } from '@/helpers';

interface WalletSuccessTileProps {
  txHash: string;
  size?: string;
}

export const WalletSuccessTile: React.FC<WalletSuccessTileProps> = ({ txHash, size = 'sm' }) => {
  const displayTxHash = truncateWalletAddress('', txHash as string);

  const headerTextSize = size === 'sm' ? 'text-sm' : 'text-lg';
  const subHeaderTextSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const iconSize = size === 'sm' ? '4rem' : '6rem';
  const padding = size === 'sm' ? 'px-4' : '';

  return (
    <div className={cn(`flex items-center justify-center ${padding} space-x-4`)}>
      <VerifySuccess
        style={{ width: iconSize, height: iconSize }}
        className="text-blue animate-scale-up"
      />
      <div className="flex flex-col items-center justify-center space-x-2">
        <div className={cn(`text-white font-semibold ${headerTextSize}`)}>Success!</div>
        <div className="flex items-center mt-2 space-x-2">
          <span className={cn(`text-neutral-1 ${subHeaderTextSize}`)}>Tx Hash:</span>
          <CopyTextField displayText={displayTxHash} includeMargin={false} />
        </div>
      </div>
    </div>
  );
};
