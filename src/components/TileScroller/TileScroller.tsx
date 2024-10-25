import React from 'react';
import { ScrollArea } from '@/ui-kit';
import { AssetTiles } from './AssetTiles';
import { ValidatorTiles } from './ValidatorTiles';
import { Asset, CombinedStakingInfo } from '@/types';

interface TileScrollerProps {
  activeIndex: number;
  isSelectable?: boolean;
  onSelectAsset?: (asset: Asset) => void;
  onSelectValidator?: (validator: CombinedStakingInfo) => void;
  isDialog?: boolean;
  isReceiveDialog?: boolean;
}

export const TileScroller: React.FC<TileScrollerProps> = ({
  activeIndex,
  isSelectable = false,
  onSelectAsset,
  onSelectValidator,
  isDialog = false,
  isReceiveDialog = false,
}) => {
  return (
    <ScrollArea
      className="flex-grow w-full overflow-y-auto border border-neutral-3 rounded-md"
      type="always"
      scrollbarProps={{}}
    >
      <div className="pr-3">
        {activeIndex === 0 ? (
          <AssetTiles isSelectable={isSelectable} onClick={onSelectAsset} isDialog={isDialog} isReceiveDialog={isReceiveDialog} />
        ) : (
          <ValidatorTiles
            isSelectable={isSelectable}
            onClick={onSelectValidator}
            isDialog={isDialog}
          />
        )}
      </div>
    </ScrollArea>
  );
};
