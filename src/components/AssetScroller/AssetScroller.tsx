import { ScrollArea } from '@/ui-kit';
import { Asset } from '@/types';
import { useAtomValue } from 'jotai';
import { walletStateAtom } from '@/atoms';
import { LogoIcon } from '@/assets/icons';

export const AssetScroller = () => {
  const walletState = useAtomValue(walletStateAtom);

  return (
    <ScrollArea
      className="flex-grow w-full overflow-y-auto mt-3"
      type="always"
      scrollbarProps={{
        className: 'max-h-[93%]',
      }}
    >
      {walletState?.assets?.map((asset: Asset) => (
        <div
          key={asset.symbol}
          className="mx-4 py-2 min-h-[52px] flex items-center not-last:border-b not-last:border-neutral-4"
        >
          <div className="rounded-full h-9 w-9 bg-neutral-2 p-2 flex items-center justify-center">
            <LogoIcon />
          </div>
          <div className="flex flex-col ml-3">
            <h6 className="text-base text-white">{asset.symbol}</h6>
            <p className="text-xs text-neutral-1">{`${asset.amount} ${asset.symbol}`}</p>
          </div>
          <div className="flex-1" />
          <div className="text-white text-h6">$1504.94</div>
        </div>
      ))}
      {/* Add small spacer */}
      <div className="h-4" />
    </ScrollArea>
  );
};