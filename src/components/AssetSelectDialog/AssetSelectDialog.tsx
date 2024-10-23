import React from 'react';
import { Input, SlideTray } from '@/ui-kit';
import { TileScroller } from '../TileScroller';
import { LogoIcon } from '@/assets/icons';
import { Asset } from '@/types';
import { cn } from '@/helpers';
import { SortDialog } from '../SortDialog';
import { useAtom, useSetAtom } from 'jotai';
import { assetDialogSortOrderAtom, assetDialogSortTypeAtom, dialogSearchAtom } from '@/atoms';

interface AssetSelectDialogProps {
  selectedAsset: Asset | null;
  isSendDialog?: boolean;
  onClick: (asset: Asset) => void;
}

export const AssetSelectDialog: React.FC<AssetSelectDialogProps> = ({
  selectedAsset,
  isSendDialog = false,
  onClick,
}) => {
  const [searchTerm, setSearchTerm] = useAtom(dialogSearchAtom);
  const setSortOrder = useSetAtom(assetDialogSortOrderAtom);
  const setSortType = useSetAtom(assetDialogSortTypeAtom);

  const resetDefaults = () => {
    setSearchTerm('');
    setSortOrder('Desc');
    setSortType('name');
  };

  return (
    <SlideTray
      triggerComponent={
        <div
          className={cn(
            `rounded-full h-7 w-7 bg-neutral-2 ${selectedAsset && selectedAsset.logo ? '' : 'p-1'} flex items-center justify-center hover:bg-blue-hover hover:text-blue-dark cursor-pointer`,
          )}
        >
          {selectedAsset && selectedAsset.logo ? (
            <img src={selectedAsset.logo} alt={selectedAsset.symbol || 'Unknown Asset'} />
          ) : (
            <LogoIcon />
          )}
        </div>
      }
      title={isSendDialog ? 'Send' : 'Receive'}
      onClose={resetDefaults}
      showBottomBorder
    >
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center w-full px-2">
          <div className="text-sm flex w-[5rem]">Tap to select</div>
          <div className="text-sm flex-1 text-center">
            Selected: <span className="text-blue">{selectedAsset?.symbol || 'None'}</span>
          </div>
          <div className="flex justify-end w-[5rem]">
            <SortDialog isDialog />
          </div>
        </div>

        <TileScroller
          activeIndex={0}
          isSelectable={true}
          addMargin={false}
          onSelectAsset={onClick}
          isDialog={true}
        />

        <div className="mx-4 mt-2 mb-2">
          <Input
            type="text"
            variant="primary"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by asset name or symbol..."
          />
        </div>
      </div>
    </SlideTray>
  );
};
