import { Swiper, SwiperClass, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.css';
import { BalanceCard, SearchBar, SortDialog, TileScroller } from '@/components';
import {
  walletStateAtom,
  swiperIndexState,
  validatorDataAtom,
  showCurrentValidatorsAtom,
  showAllAssetsAtom,
  searchTermAtom,
} from '@/atoms';
import { useEffect, useRef } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Button } from '@/ui-kit';
import { removeTrailingZeroes, convertToGreaterUnit, fetchValidatorData } from '@/helpers';
import { GREATER_EXPONENT_DEFAULT, LOCAL_ASSET_REGISTRY } from '@/constants';

export const Main = () => {
  const walletState = useAtomValue(walletStateAtom);
  const [activeIndex, setActiveIndex] = useAtom(swiperIndexState);
  const [validatorData, setValidatorData] = useAtom(validatorDataAtom);
  const [showCurrentValidators, setShowCurrentValidators] = useAtom(showCurrentValidatorsAtom);
  const [showAllAssets, setShowAllAssets] = useAtom(showAllAssetsAtom);
  const setSearchTerm = useSetAtom(searchTermAtom);

  const swiperRef = useRef<SwiperClass | null>(null);
  const totalSlides = 2;

  useEffect(() => {
    // Sync the swiper visual state
    if (swiperRef.current) {
      swiperRef.current.slideTo(activeIndex);
    }
  }, [activeIndex, walletState.address]);

  useEffect(() => {
    setSearchTerm('');
  }, [activeIndex]);

  // Fetch all validator data (delegations, validators, rewards) in one go
  useEffect(() => {
    if (walletState.address) {
      fetchValidatorData(walletState.address)
        .then(data => setValidatorData(data))
        .catch(error => console.error('Error fetching staking data:', error));
    }
  }, [walletState.address]);

  // Sync the swiper visual state
  useEffect(() => {
    if (swiperRef.current) {
      swiperRef.current.slideTo(activeIndex);
    }
  }, [activeIndex]);

  // Toggle between "Non-Zero" and "All" holdings
  const assetViewToggleChange = (shouldShowAllAssets: boolean) => {
    setShowAllAssets(shouldShowAllAssets);
  };

  // Toggle between "All" and "Current" validators
  const validatorViewToggleChange = (shouldShowCurrent: boolean) => {
    setShowCurrentValidators(shouldShowCurrent);
  };

  // Calculate total available MLD balance
  const currentExponent = LOCAL_ASSET_REGISTRY.note.exponent || GREATER_EXPONENT_DEFAULT;
  const totalAvailableMLD = walletState.assets
    .filter(asset => asset.denom === LOCAL_ASSET_REGISTRY.note.denom)
    .reduce((sum, delegation) => sum + parseFloat(delegation.amount), 0)
    .toFixed(currentExponent);
  const formattedTotalAvailableMLD = removeTrailingZeroes(totalAvailableMLD);

  // Calculate total staked MLD balance
  const totalStakedMLD = validatorData
    .filter(item => item.balance.denom === LOCAL_ASSET_REGISTRY.note.denom)
    .reduce((sum, item) => sum + parseFloat(item.balance?.amount || '0'), 0);
  const formattedTotalStakedMLD = removeTrailingZeroes(
    convertToGreaterUnit(totalStakedMLD, currentExponent).toFixed(currentExponent),
  );

  // Calculate total rewards
  const totalStakedRewards = validatorData.reduce((sum, item) => {
    const totalReward = item.rewards.reduce(
      (rewardSum, reward) => rewardSum + parseFloat(reward.amount),
      0,
    );
    return sum + totalReward;
  }, 0);
  const formattedConvertedTotalRewards = removeTrailingZeroes(
    convertToGreaterUnit(totalStakedRewards, 6).toFixed(6),
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Swiper Component for Balance Cards */}
      <div className="relative h-48 flex-none overflow-hidden">
        <Swiper
          spaceBetween={50}
          slidesPerView={1}
          loop={false}
          onSlideChange={swiper => setActiveIndex(swiper.activeIndex)}
          onSwiper={swiper => {
            swiperRef.current = swiper;
          }}
        >
          <SwiperSlide>
            <div className="w-full px-4 mt-4 flex-shrink-0">
              <BalanceCard
                title="Available balance"
                primaryText={`${formattedTotalAvailableMLD} MLD`}
                currentStep={activeIndex}
                totalSteps={totalSlides}
              />
            </div>
          </SwiperSlide>
          <SwiperSlide>
            <div className="w-full px-4 mt-4 flex-shrink-0">
              <BalanceCard
                title="Staked balance"
                primaryText={`${formattedConvertedTotalRewards} MLD`}
                secondaryText={`${formattedTotalStakedMLD} MLD`}
                currentStep={activeIndex}
                totalSteps={totalSlides}
              />
            </div>
          </SwiperSlide>
        </Swiper>
      </div>

      {/* Assets section */}
      <div className="flex-grow pt-4 px-4 pb-4 flex flex-col overflow-hidden">
        {activeIndex === 0 ? (
          <h3 className="text-h4 text-white font-bold text-left flex items-center px-2">
            <span className="flex-1">Holdings</span>
            <div className="flex-1 flex justify-center items-center space-x-2">
              <Button
                variant={!showAllAssets ? 'selected' : 'unselected'}
                size="small"
                onClick={() => assetViewToggleChange(false)}
                className="px-2 rounded-md text-xs"
              >
                Non-Zero
              </Button>
              <Button
                variant={showAllAssets ? 'selected' : 'unselected'}
                size="small"
                onClick={() => assetViewToggleChange(true)}
                className="px-2 rounded-md text-xs"
              >
                All
              </Button>
            </div>
            <div className="flex-1 flex justify-end">
              <SortDialog />
            </div>
          </h3>
        ) : (
          <h3 className="text-h4 text-white font-bold text-left flex items-center px-2">
            <span className="flex-1">Validators</span>
            <div className="flex-1 flex justify-center items-center space-x-2">
              <Button
                variant={showCurrentValidators ? 'selected' : 'unselected'}
                size="small"
                onClick={() => validatorViewToggleChange(true)}
                className="px-2 rounded-md text-xs"
              >
                Current
              </Button>
              <Button
                variant={!showCurrentValidators ? 'selected' : 'unselected'}
                size="small"
                onClick={() => validatorViewToggleChange(false)}
                className="px-2 rounded-md text-xs"
              >
                All
              </Button>
            </div>
            <div className="flex-1 flex justify-end">
              <SortDialog isValidatorSort />
            </div>
          </h3>
        )}

        {/* Display the filtered and sorted assets */}
        <div className="flex justify-between pr-3 text-neutral-1 text-xs font-bold mb-1">
          {activeIndex === 0 ? (
            <>
              <span className="w-[3.5rem]">Logo</span>
              <span>Chain</span>
              <span className="flex-1"></span>
              <span className="flex-1 text-right">Amount</span>
            </>
          ) : (
            <>
              <span className="w-[3.5rem]">Logo</span>
              <span>Delegations</span>
              <span className="flex-1"></span>
              <span className="flex-1 text-right">Rewards</span>
            </>
          )}
        </div>

        <TileScroller activeIndex={activeIndex} />

        <SearchBar />
      </div>
    </div>
  );
};
