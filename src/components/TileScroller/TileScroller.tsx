import React from 'react';
import { ScrollArea } from '@/ui-kit';
import { AssetTiles } from './AssetTiles';
import { ValidatorTiles } from './ValidatorTiles';
import { Asset, CombinedStakingInfo } from '@/types';
import { useGesture } from '@use-gesture/react';
import { useState, useRef } from 'react';

interface TileScrollerProps {
  activeIndex: number;
  isSelectable?: boolean;
  onSelectAsset?: (asset: Asset) => void;
  onSelectValidator?: (validator: CombinedStakingInfo) => void;
  isDialog?: boolean;
}

export const TileScroller: React.FC<TileScrollerProps> = ({
  activeIndex,
  isSelectable = false,
  onSelectAsset,
  onSelectValidator,
  isDialog = false,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [isHandled, setIsHandled] = useState(false);

  const handleRefresh = async () => {
    console.log('refreshing.....');
    setIsRefreshing(true);
    // Refresh logic goes here
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const bind = useGesture({
    onDrag: ({
      movement: [, my],
      memo = scrollerRef.current?.getBoundingClientRect().top,
      event,
    }) => {
      // Ensure we do not handle drag if it's triggered from SlideTray
      if (!event.target || (event.target as HTMLElement).closest('.slide-tray')) return;

      console.log('drag recognized.....');
      if (!isHandled && my < -100 && !isRefreshing) {
        console.log('triggering refresh');
        setIsHandled(true);
        handleRefresh();
      }
      return memo;
    },
    onDragEnd: () => {
      setIsHandled(false);
    },
  });

  return (
    <ScrollArea
      className="flex-grow w-full overflow-y-auto border border-neutral-3 rounded-md"
      type="always"
      scrollbarProps={{}}
      ref={scrollerRef}
      {...bind()}
    >
      <div className="pr-3">
        {isRefreshing ? (
          <div className="text-center py-4">Refreshing...</div>
        ) : activeIndex === 0 ? (
          <AssetTiles isSelectable={isSelectable} onClick={onSelectAsset} isDialog={isDialog} />
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
