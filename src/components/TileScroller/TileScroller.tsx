import React from 'react';
import { ScrollArea } from '@/ui-kit';
import { AssetTiles } from './AssetTiles';
import { ValidatorTiles } from './ValidatorTiles';
import { Asset } from '@/types';

interface TileScrollerProps {
  activeIndex: number;
  isSelectable?: boolean;
  addMargin?: boolean;
  onSelectAsset?: (asset: Asset) => void;
}

export const TileScroller: React.FC<TileScrollerProps> = ({
  activeIndex,
  isSelectable = false,
  addMargin = true,
  onSelectAsset,
}) => {
  return (
    <ScrollArea className="flex-grow w-full overflow-y-auto" type="always" scrollbarProps={{}}>
      {activeIndex === 0 ? (
        <AssetTiles isSelectable={isSelectable} addMargin={addMargin} onClick={onSelectAsset} />
      ) : (
        <ValidatorTiles isSelectable={isSelectable} addMargin={addMargin} />
      )}
    </ScrollArea>
  );
};
