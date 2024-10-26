import React, { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '@/ui-kit';
import { Asset, CombinedStakingInfo } from '@/types';
import { useDrag } from '@use-gesture/react';
import { animated, useSpring } from 'react-spring';
import { Loader } from '../Loader';
import { ValidatorTiles } from '../TileScroller/ValidatorTiles';
import { AssetTiles } from '../TileScroller/AssetTiles';

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
  const [triggerRefresh, setTriggerRefresh] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragStarted, setDragStarted] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  const TOP_OVERSCROLL_LIMIT = 52;
  const OVERSCROLL_ACTIVATION_THRESHOLD = TOP_OVERSCROLL_LIMIT * 0.8;
  const BOTTOM_OVERSCROLL_PERCENTAGE = 0.15;
  const MAX_REFRESH_VELOCITY = 0.5;

  const [{ y, loaderOpacity }, api] = useSpring(() => ({ y: 0, loaderOpacity: 0 }));

  const handleRefresh = async () => {
    console.log('Refreshing...');
    setIsRefreshing(true);
    api.start({ loaderOpacity: 1 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
    api.start({ y: 0, loaderOpacity: 0 });
  };

  useEffect(() => {
    if (triggerRefresh) {
      handleRefresh();
      setTriggerRefresh(false);
    }
  }, [triggerRefresh]);

  const bind = useDrag(
    ({
      movement: [, my],
      memo = viewportRef.current?.scrollTop || 0,
      event,
      dragging,
      last,
      velocity,
    }) => {
      if (!isMouseDown || !event.target || (event.target as HTMLElement).closest('.slide-tray')) {
        return memo;
      }

      if (!dragStarted && my !== 0) setDragStarted(true);

      if (viewportRef.current) {
        const viewport = viewportRef.current;
        const atTop = viewport.scrollTop <= 0;
        const atBottom = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight;

        const maxBottomOverscrollDistance = viewport.clientHeight * BOTTOM_OVERSCROLL_PERCENTAGE;
        const limitedOverscroll = atTop
          ? Math.min(my / 2, TOP_OVERSCROLL_LIMIT)
          : Math.max(my / 2, -maxBottomOverscrollDistance);

        if (dragging) {
          if ((atTop && my > 0) || (atBottom && my < 0)) {
            const overscrollPercentage = (limitedOverscroll / TOP_OVERSCROLL_LIMIT) * 100;
            console.log(
              `Overscroll Value: ${limitedOverscroll}px, Percentage: ${overscrollPercentage.toFixed(2)}%, Threshold: ${OVERSCROLL_ACTIVATION_THRESHOLD}`,
            );

            api.start({
              y: limitedOverscroll,
              loaderOpacity: atTop ? limitedOverscroll / TOP_OVERSCROLL_LIMIT : 0,
            });
          } else {
            viewport.scrollTop = memo - my;
            api.start({ y: 0, loaderOpacity: 0 });
          }
        } else if (last && !isRefreshing) {
          const velocityMagnitude = Math.sqrt(velocity[0] ** 2 + velocity[1] ** 2);
          // Only trigger refresh if velocity is below threshold
          if (
            atTop &&
            limitedOverscroll > OVERSCROLL_ACTIVATION_THRESHOLD &&
            velocityMagnitude < MAX_REFRESH_VELOCITY
          ) {
            api.start({ y: TOP_OVERSCROLL_LIMIT, loaderOpacity: 1 });
            setTriggerRefresh(true);
          } else {
            api.start({ y: 0, loaderOpacity: 0 });
          }
          setDragStarted(false);
        }
      }

      return memo;
    },
  );

  const handleMouseDown = () => setIsMouseDown(true);
  const handleMouseUp = () => {
    setIsMouseDown(false);
    setDragStarted(false);
    if (!isRefreshing) {
      api.start({ y: 0, loaderOpacity: 0 });
    }
  };

  useEffect(() => {
    const resetDrag = () => {
      setIsMouseDown(false);
      setDragStarted(false);
      if (!isRefreshing) {
        api.start({ y: 0, loaderOpacity: 0 });
      }
    };

    window.addEventListener('mouseup', resetDrag);
    window.addEventListener('mouseleave', resetDrag);
    window.addEventListener('pointercancel', resetDrag);

    return () => {
      window.removeEventListener('mouseup', resetDrag);
      window.removeEventListener('mouseleave', resetDrag);
      window.removeEventListener('pointercancel', resetDrag);
    };
  }, [api, isRefreshing]);

  // TODO: on refresh, re-query for data
  // TODO: on refresh completion, re-populate data and remove loader
  return (
    <ScrollArea
      // TODO: move select-none to top level, add select option to specific areas of app that allow it (inputs)
      className="select-none flex-grow w-full overflow-y-auto border border-neutral-3 rounded-md"
      type="always"
      scrollbarProps={{}}
      viewportRef={viewportRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <animated.div
        className="relative pr-3"
        style={{
          transform: y.to(v => `translateY(${v}px)`),
        }}
        {...bind()}
      >
        <animated.div
          className="absolute top-[-52px] left-0 right-0 flex justify-center items-center h-12"
          style={{
            opacity: loaderOpacity,
            transform: y.to(v => `translateY(${Math.max(v - 52, -52)}px)`),
          }}
        >
          <Loader isSpinning={isRefreshing} />
        </animated.div>

        {activeIndex === 0 ? (
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
