import React, { useEffect } from 'react';
import { SlideTray } from '@/ui-kit';
import { TileScroller } from '../TileScroller';
import { LogoIcon } from '@/assets/icons';
import { Asset } from '@/types';
import { cn } from '@/helpers';
import { SortDialog } from '../SortDialog';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  assetDialogSortOrderAtom,
  assetDialogSortTypeAtom,
  dialogSearchTermAtom,
  dialogSelectedAssetAtom,
  receiveStateAtom,
  sendStateAtom,
} from '@/atoms';
import { SearchBar } from '../SearchBar';

interface AssetSelectDialogProps {
  isSendDialog?: boolean;
  onClick: (asset: Asset) => void;
}

export const AssetSelectDialog: React.FC<AssetSelectDialogProps> = ({
  isSendDialog = false,
  onClick,
}) => {
  const setSearchTerm = useSetAtom(dialogSearchTermAtom);
  const setSortOrder = useSetAtom(assetDialogSortOrderAtom);
  const setSortType = useSetAtom(assetDialogSortTypeAtom);
  const currentState = useAtomValue(isSendDialog ? sendStateAtom : receiveStateAtom);
  const [dialogSelectedAsset, setDialogSelectedAsset] = useAtom(dialogSelectedAssetAtom);

  const resetDefaults = () => {
    setSearchTerm('');
    setSortOrder('Desc');
    setSortType('name');
  };

  useEffect(() => {
    setDialogSelectedAsset(currentState.asset);
  }, [currentState.asset]);

  return (
    <SlideTray
      triggerComponent={
        <div
          className={cn(
            `rounded-full h-7 w-7 bg-neutral-2 ${dialogSelectedAsset.logo ? '' : 'p-1'} flex items-center justify-center hover:bg-blue-hover hover:text-blue-dark cursor-pointer`,
          )}
        >
          {dialogSelectedAsset.logo ? (
            <img
              src={dialogSelectedAsset.logo}
              alt={dialogSelectedAsset.symbol || 'Unknown Asset'}
            />
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
            Selected: <span className="text-blue">{dialogSelectedAsset.symbol || 'None'}</span>
          </div>
          <div className="flex justify-end w-[5rem]">
            <SortDialog isDialog />
          </div>
        </div>

        <TileScroller activeIndex={0} isSelectable={true} onSelectAsset={onClick} isDialog={true} />

        <SearchBar isDialog />
      </div>
    </SlideTray>
  );
};
