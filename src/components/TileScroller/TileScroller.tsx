import React from 'react';
import { ScrollArea } from '@/ui-kit';
import { AssetTiles } from './AssetTiles';
import { ValidatorTiles } from './ValidatorTiles';
import { Asset, CombinedStakingInfo } from '@/types';

interface TileScrollerProps {
  activeIndex: number;
  isSelectable?: boolean;
  addMargin?: boolean;
  onSelectAsset?: (asset: Asset) => void;
  onSelectValidator?: (validator: CombinedStakingInfo) => void;
  isDialog?: boolean;
}

export const TileScroller: React.FC<TileScrollerProps> = ({
  activeIndex,
  isSelectable = false,
  addMargin = true,
  onSelectAsset,
  onSelectValidator,
  isDialog = false,
}) => {
  return (
    // TODO: add border to TileScroller
    <ScrollArea className="flex-grow w-full overflow-y-auto" type="always" scrollbarProps={{}}>
      {activeIndex === 0 ? (
        <AssetTiles
          isSelectable={isSelectable}
          addMargin={addMargin}
          onClick={onSelectAsset}
          isDialog={isDialog}
        />
      ) : (
        <ValidatorTiles
          isSelectable={isSelectable}
          addMargin={addMargin}
          onClick={onSelectValidator}
          isDialog={isDialog}
        />
      )}
    </ScrollArea>
  );
};
