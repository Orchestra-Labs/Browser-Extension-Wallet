import React from 'react';
import { ScrollArea } from '@/ui-kit';
import { AssetTiles } from './AssetTiles';
import { ValidatorTiles } from './ValidatorTiles';
import { Asset, CombinedStakingInfo } from '@/types';
import { useDrag } from '@use-gesture/react';
import { animated, useSpring } from 'react-spring';
import { useState, useRef } from 'react';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Using react-spring to control bounce effect
  const [{ y }, api] = useSpring(() => ({ y: 0 }));

  const handleRefresh = async () => {
    console.log('Refreshing...');
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const bind = useDrag(
    ({ movement: [, my], memo = viewportRef.current?.scrollTop || 0, event, dragging, last }) => {
      if (!event.target || (event.target as HTMLElement).closest('.slide-tray')) return memo;

      if (viewportRef.current) {
        const viewport = viewportRef.current;
        const atTop = viewport.scrollTop <= 0;
        const atBottom = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight;

        if (dragging) {
          if ((atTop && my > 0) || (atBottom && my < 0)) {
            // Overscroll effect: move the content without actually scrolling
            api.start({ y: my / 2 }); // Divide by 2 for a dampened pull effect
          } else {
            // Regular scroll behavior
            viewport.scrollTop = memo - my;
            api.start({ y: 0 }); // Ensure bounce resets when in bounds
          }
        } else if (last) {
          // If drag ended, animate back to original position if overscrolled
          if (atTop && my > 0) {
            api.start({ y: 0, immediate: false });
          } else if (atBottom && my < 0) {
            api.start({ y: 0, immediate: false });
          }
        }

        // Trigger refresh if dragged down from top position
        if (atTop && my > 100 && !isRefreshing) {
          console.log('Triggering refresh');
          handleRefresh();
        }
      }

      return memo;
    },
  );

  // TODO: enable swipe to refresh
  // animate drag into position of loader above scroll area
  // re-query for data
  // re-populate data and animate away loader
  return (
    <ScrollArea
      className="flex-grow w-full overflow-y-auto border border-neutral-3 rounded-md"
      type="always"
      scrollbarProps={{}}
      viewportRef={viewportRef}
    >
      <animated.div
        className="pr-3"
        style={{
          transform: y.to(v => `translateY(${v}px)`), // Apply spring animation for bounce effect
        }}
        {...bind()}
      >
        {isRefreshing ? (
          <div className="text-center py-4">Refreshing...</div>
        ) : activeIndex === 0 ? (
          <AssetTiles
            isSelectable={isSelectable}
            onClick={onSelectAsset}
            isDialog={isDialog}
            isReceiveDialog={isReceiveDialog}
          />
        ) : (
          <ValidatorTiles
            isSelectable={isSelectable}
            onClick={onSelectValidator}
            isDialog={isDialog}
          />
        )}
      </animated.div>
    </ScrollArea>
  );
};
