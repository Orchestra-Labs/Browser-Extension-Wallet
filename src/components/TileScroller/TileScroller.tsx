import React, { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/ui-kit';
import { AssetTiles } from './AssetTiles';
import { ValidatorTiles } from './ValidatorTiles';
import { Asset, CombinedStakingInfo } from '@/types';
import { useDrag } from '@use-gesture/react';
import { animated, useSpring } from 'react-spring';

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
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragStarted, setDragStarted] = useState(false);
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
      console.log(
        `Dragging: ${dragging}, Last: ${last}, MouseY: ${my}, Memo: ${memo}, DragStarted: ${dragStarted}, isMouseDown: ${isMouseDown}`,
      );

      // Only start dragging if the mouse is down
      if (!isMouseDown || !event.target || (event.target as HTMLElement).closest('.slide-tray')) {
        console.log('Drag ignored due to slide tray, invalid target, or mouse not being down.');
        return memo;
      }

      if (!dragStarted && my !== 0) setDragStarted(true); // Only set dragStarted if there's movement

      if (viewportRef.current) {
        const viewport = viewportRef.current;
        const atTop = viewport.scrollTop <= 0;
        const atBottom = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight;

        if (dragging) {
          if ((atTop && my > 0) || (atBottom && my < 0)) {
            api.start({ y: my / 2 });
          } else {
            viewport.scrollTop = memo - my;
            api.start({ y: 0 });
          }
        } else if (last) {
          if (atTop && my > 0) {
            api.start({ y: 0, immediate: false });
          } else if (atBottom && my < 0) {
            api.start({ y: 0, immediate: false });
          }
          setDragStarted(false); // Reset dragStarted on drag end
        }

        if (atTop && my > 100 && !isRefreshing) {
          console.log('Triggering refresh');
          handleRefresh();
        }
      }

      return memo;
    },
  );

  // Handle mouse down/up to track if mouse is actively pressed
  const handleMouseDown = () => {
    setIsMouseDown(true);
    console.log('Mouse down - ready to start drag.');
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setDragStarted(false);
    api.start({ y: 0 });
    console.log('Mouse up - reset drag state.');
  };

  useEffect(() => {
    const resetDrag = () => {
      console.log('Global reset drag - Mouse or pointer left window.');
      setIsMouseDown(false);
      setDragStarted(false);
      api.start({ y: 0 });
    };

    window.addEventListener('mouseup', resetDrag);
    window.addEventListener('mouseleave', resetDrag);
    window.addEventListener('pointercancel', resetDrag);

    return () => {
      window.removeEventListener('mouseup', resetDrag);
      window.removeEventListener('mouseleave', resetDrag);
      window.removeEventListener('pointercancel', resetDrag);
    };
  }, [api]);

  // TODO: enable swipe to refresh
  // animate drag into position of loader above scroll area
  // re-query for data
  // re-populate data and remove loader
  // add max overscroll to bottom?
  return (
    <ScrollArea
      className="select-none flex-grow w-full overflow-y-auto border border-neutral-3 rounded-md"
      type="always"
      scrollbarProps={{}}
      viewportRef={viewportRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <animated.div
        className="pr-3"
        style={{
          transform: y.to(v => `translateY(${v}px)`),
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
