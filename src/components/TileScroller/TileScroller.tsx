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
}

export const TileScroller: React.FC<TileScrollerProps> = ({
  activeIndex,
  isSelectable = false,
  addMargin = true,
  onSelectAsset,
  onSelectValidator,
}) => {
  return (
    // TODO: add botder to TileScroller
    <ScrollArea className="flex-grow w-full overflow-y-auto" type="always" scrollbarProps={{}}>
      {activeIndex === 0 ? (
        <AssetTiles isSelectable={isSelectable} addMargin={addMargin} onClick={onSelectAsset} />
      ) : (
        <ValidatorTiles
          isSelectable={isSelectable}
          addMargin={addMargin}
          onClick={onSelectValidator}
        />
      )}
    </ScrollArea>
  );
};
