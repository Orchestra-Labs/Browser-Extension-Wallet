import { Swiper, SwiperClass, SwiperSlide } from 'swiper/react';
import 'swiper/swiper-bundle.css';
import { BalanceCard, TileScroller } from '@/components';
import {
  walletStateAtom,
  delegationAtom,
  paginationAtom,
  validatorInfoAtom,
  rewardsAtom,
  showCurrentValidatorsAtom,
  swiperIndexState,
} from '@/atoms';
import { useEffect, useRef } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { GREATER_EXPONENT_DEFAULT, LOCAL_ASSET_REGISTRY, CHAIN_NODES } from '@/constants';
import axios from 'axios';
import {
  convertToGreaterUnit,
  fetchDelegations,
  fetchValidators,
  removeTrailingZeroes,
} from '@/helpers';
import { Sort } from '@/assets/icons';
import { Button } from '@/ui-kit';

export const Main = () => {
  const walletState = useAtomValue(walletStateAtom);
  const [delegationState, setDelegationState] = useAtom(delegationAtom);
  const setPaginationState = useSetAtom(paginationAtom);
  const setValidatorInfo = useSetAtom(validatorInfoAtom);
  const totalSlides = 2;
  const [activeIndex, setActiveIndex] = useAtom(swiperIndexState);
  const [rewards, setRewards] = useAtom(rewardsAtom);
  const [showCurrentValidators, setValidatorToggle] = useAtom(showCurrentValidatorsAtom);
  const swiperRef = useRef<SwiperClass | null>(null);

  // Fetch delegation and validator info
  const fetchDelegationsAndValidators = async () => {
    if (!walletState.address) return;

    try {
      const { delegations, pagination } = await fetchDelegations(walletState.address);
      setDelegationState(delegations);
      setPaginationState(pagination);

      const validatorPromises = delegations.map(delegation =>
        fetchValidators(delegation.delegation.validator_address),
      );
      const validators = await Promise.all(validatorPromises);
      setValidatorInfo(validators.flatMap(info => info.validators));

      fetchRewards(walletState.address, delegations);
    } catch (error) {
      console.error('Error fetching delegations or validators:', error);
    }
  };

  // Fetch rewards for each validator
  const fetchRewards = async (walletAddress: string, delegations: any[]) => {
    try {
      const rewardsPromises = delegations.map(async delegation => {
        const apiUrl = `${CHAIN_NODES.symphonytestnet[0].rest}/cosmos/distribution/v1beta1/delegators/${walletAddress}/rewards/${delegation.delegation.validator_address}`;
        const response = await axios.get(apiUrl);
        return {
          validator: delegation.delegation.validator_address,
          rewards: response.data.rewards || [],
        };
      });

      const rewardsData = await Promise.all(rewardsPromises);
      setRewards(rewardsData);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    }
  };

  // Fetch delegations and validators when activeIndex changes
  useEffect(() => {
    if (activeIndex === 1) {
      fetchDelegationsAndValidators();
    }

    // Sync the swiper visual state
    if (swiperRef.current) {
      swiperRef.current.slideTo(activeIndex);
    }
  }, [activeIndex, walletState.address]);

  // Toggle between "All" and "Current" validators
  const handleToggleChange = (shouldShowCurrent: boolean) => {
    setValidatorToggle(shouldShowCurrent);
  };

  // Calculate total available MLD balance
  const totalAvailableMLD = walletState.assets
    .filter(asset => asset.denom === 'note')
    .reduce((sum, delegation) => sum + parseFloat(delegation.amount), 0)
    .toFixed(GREATER_EXPONENT_DEFAULT);
  const formattedTotalAvailableMLD = removeTrailingZeroes(totalAvailableMLD);

  // Calculate total staked MLD balance
  const totalStakedMLD = delegationState
    .filter(delegation => delegation.balance.denom === 'note')
    .reduce(
      (sum, delegation) =>
        sum +
        parseFloat(delegation.balance.amount) /
          Math.pow(10, LOCAL_ASSET_REGISTRY.note.exponent || GREATER_EXPONENT_DEFAULT),
      0,
    );
  const formattedTotalStakedMLD = removeTrailingZeroes(totalStakedMLD);

  const totalStakedRewards = rewards.reduce((sum, reward) => {
    const totalReward = reward.rewards.reduce((rSum, r) => rSum + parseFloat(r.amount), 0);
    return sum + totalReward;
  }, 0);
  const convertedTotalRewards = convertToGreaterUnit(
    totalStakedRewards,
    GREATER_EXPONENT_DEFAULT,
  ).toFixed(GREATER_EXPONENT_DEFAULT);
  const formattedConvertedTotalRewards = removeTrailingZeroes(convertedTotalRewards);

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
      <div className="flex-grow pt-4 pb-4 flex flex-col overflow-hidden">
        {activeIndex === 0 ? (
          <h3 className="text-h4 text-white font-bold px-4 text-left flex items-center">
            <span className="flex-1">Holdings</span>
            <div className="flex-1 flex justify-end">
              {/* TODO: add functionality */}
              <Sort width={20} className="text-white" />
            </div>
          </h3>
        ) : (
          <h3 className="text-h4 text-white font-bold px-4 text-left flex items-center">
            <span className="flex-1">Validators</span>
            <div className="flex-1 flex justify-center items-center space-x-2">
              <Button
                variant={showCurrentValidators ? 'selected' : 'unselected'}
                size="small"
                onClick={() => handleToggleChange(true)}
                className="px-2 rounded-md text-xs"
              >
                Current
              </Button>
              <Button
                variant={!showCurrentValidators ? 'selected' : 'unselected'}
                size="small"
                onClick={() => handleToggleChange(false)}
                className="px-2 rounded-md text-xs"
              >
                All
              </Button>
            </div>
            <div className="flex-1 flex justify-end">
              {/* TODO: add functionality */}
              <Sort width={20} className="text-white" />
            </div>
          </h3>
        )}

        <div className="flex justify-between px-4 text-neutral-1 text-xs font-bold">
          {activeIndex === 1 ? (
            <>
              <span>Delegations</span>
              <span>Rewards</span>
            </>
          ) : (
            <span>&nbsp;</span>
          )}
        </div>

        {walletState.address ? (
          <TileScroller activeIndex={activeIndex} />
        ) : (
          <p className="text-base text-neutral-1 px-4">No available assets</p>
        )}
        <div className="h-4" />
      </div>
    </div>
  );
};
