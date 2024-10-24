import { useState } from 'react';
import { CombinedStakingInfo } from '@/types';
import { SlideTray, Button, Input } from '@/ui-kit';
import { LogoIcon } from '@/assets/icons';
import { ScrollTile } from '../ScrollTile';
import {
  claimAndRestake,
  claimRewards,
  convertToGreaterUnit,
  isValidUrl,
  removeTrailingZeroes,
  selectTextColorByStatus,
  stakeToValidator,
  unstakeFromValidator,
} from '@/helpers';
import { GREATER_EXPONENT_DEFAULT, LOCAL_ASSET_REGISTRY } from '@/constants';
import { useAtomValue } from 'jotai';
import { selectedValidatorsAtom, walletStateAtom } from '@/atoms';

interface ValidatorScrollTileProps {
  combinedStakingInfo: CombinedStakingInfo;
  isSelectable?: boolean;
  onClick?: (validator: CombinedStakingInfo) => void;
}

export const ValidatorScrollTile = ({
  combinedStakingInfo,
  isSelectable = false,
  onClick,
}: ValidatorScrollTileProps) => {
  const selectedValidators = useAtomValue(selectedValidatorsAtom);

  const [selectedAction, setSelectedAction] = useState<'stake' | 'unstake' | 'claim' | null>(
    !combinedStakingInfo.delegation ? 'stake' : null,
  );
  const walletState = useAtomValue(walletStateAtom);
  const [amount, setAmount] = useState('');

  // Destructure combined info
  const { validator, delegation, balance, rewards } = combinedStakingInfo;
  const delegationResponse = { delegation, balance };

  // Aggregating the rewards (sum all reward amounts for this validator)
  const rewardAmount = rewards
    .reduce((sum, reward) => sum + parseFloat(reward.amount), 0)
    .toString();
  const formattedRewardAmount = `${removeTrailingZeroes(
    convertToGreaterUnit(parseFloat(rewardAmount), GREATER_EXPONENT_DEFAULT).toFixed(
      GREATER_EXPONENT_DEFAULT,
    ),
  )} MLD`;

  const delegatedAmount = removeTrailingZeroes(
    convertToGreaterUnit(parseFloat(delegation.shares || '0'), GREATER_EXPONENT_DEFAULT),
  );

  const title = validator.description.moniker || 'Unknown Validator';
  const commission = `${parseFloat(validator.commission.commission_rates.rate) * 100}%`;

  let subTitle: string;
  if (validator.jailed) {
    subTitle = 'Jailed';
  } else if (validator.status === 'BOND_STATUS_UNBONDED') {
    subTitle = 'Inactive';
  } else if (delegatedAmount === '0') {
    subTitle = 'No delegation';
  } else {
    subTitle = `${delegatedAmount} ${LOCAL_ASSET_REGISTRY.note.symbol}`;
  }

  // TODO: pull dynamically from the validator
  const unbondingDays = 12;

  // Determine validator status
  let statusLabel = '';
  let statusColor: 'good' | 'warn' | 'error' = 'good';
  if (validator.jailed) {
    statusLabel = 'Jailed';
    statusColor = 'error';
  } else if (validator.status === 'BOND_STATUS_UNBONDING') {
    statusLabel = 'Unbonding';
    statusColor = 'warn';
  } else if (validator.status === 'BOND_STATUS_UNBONDED') {
    statusLabel = 'Inactive';
    statusColor = 'warn';
  } else {
    statusLabel = 'Active';
    statusColor = 'good';
  }

  const textColor = selectTextColorByStatus(statusColor);

  // Validator website validation
  const website = validator.description.website;
  const isWebsiteValid = isValidUrl(website);

  const handleClick = () => {
    if (onClick) {
      onClick(combinedStakingInfo);
    }
  };

  const isSelected = selectedValidators.some(
    v => v.delegation.validator_address === combinedStakingInfo.delegation.validator_address,
  );

  return (
    <>
      {isSelectable ? (
        <ScrollTile
          title={title}
          subtitle={subTitle}
          value={formattedRewardAmount}
          icon={<LogoIcon />}
          status={statusColor}
          selected={isSelected}
          onClick={handleClick}
        />
      ) : (
        <SlideTray
          triggerComponent={
            <div>
              <ScrollTile
                title={title}
                subtitle={subTitle}
                value={formattedRewardAmount}
                icon={<LogoIcon />}
                status={statusColor}
              />
            </div>
          }
          title={title}
          showBottomBorder
          status={statusColor}
        >
          {rewards && (
            <>
              <div className="text-center mb-2">
                <div className="truncate text-base font-medium text-neutral-1">
                  Reward: <span className="text-blue">{formattedRewardAmount}</span>
                </div>
                <span className="text-grey-dark text-xs text-base">
                  Unstaking period <span className="text-warning">{unbondingDays} days</span>
                </span>
              </div>
            </>
          )}

          {/* TODO: on button press, animate collapse to 1 line / re-expansion? */}
          {/* Validator Information */}
          <div className="mb-4 min-h-[7.5rem] max-h-[7.5rem] overflow-hidden shadow-md bg-black p-2">
            <p>
              <strong>Status: </strong>
              <span className={textColor}>{statusLabel}</span>
            </p>
            <p>
              <strong>Amount Staked:</strong> <span className="text-blue">{delegatedAmount}</span>
            </p>
            <p>
              <strong>Validator Commission:</strong> {commission}
            </p>
            <p className="truncate">
              <strong>Website:</strong>{' '}
              {isWebsiteValid ? (
                <a
                  href={website.startsWith('http') ? website : `https://${website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {website}
                </a>
              ) : (
                <span>{website}</span>
              )}
            </p>
            <p className="line-clamp-2 max-h-[3.5rem] overflow-hidden">
              <strong>Details:</strong> {validator.description.details}
            </p>
          </div>

          {/* Action Selection */}
          {delegation && (
            <div className="flex justify-between w-full px-2 mb-2">
              {/* Apply flex here */}
              <Button className="w-full" onClick={() => setSelectedAction('stake')}>
                Stake
              </Button>
              <Button
                variant="secondary"
                className="w-full mx-2"
                onClick={() => setSelectedAction('unstake')}
              >
                Unstake
              </Button>
              <Button className="w-full" onClick={() => setSelectedAction('claim')}>
                Claim
              </Button>
            </div>
          )}

          <div className="flex flex-col items-center justify-center h-[4rem] px-[1.5rem]">
            {(selectedAction === 'stake' || selectedAction === 'unstake') && (
              <>
                <div className="flex items-center w-full">
                  <div className="flex-grow mr-2">
                    <Input
                      variant="primary"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="text-white mx-2"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="ml-2 px-2 py-1 rounded-md w-16"
                    onClick={() => {
                      selectedAction === 'stake'
                        ? stakeToValidator(
                            amount,
                            LOCAL_ASSET_REGISTRY.note.denom,
                            walletState.address,
                            validator.operator_address,
                          )
                        : unstakeFromValidator(amount, delegationResponse);
                    }}
                  >
                    {selectedAction === 'stake' ? 'Stake' : 'Unstake'}
                  </Button>
                </div>
                <div className="flex justify-between w-full mt-1">
                  <Button
                    size="xs"
                    variant="unselected"
                    className="px-2 rounded-md text-xs"
                    onClick={() => setAmount('')}
                  >
                    Clear
                  </Button>
                  <Button
                    size="xs"
                    variant="unselected"
                    className="px-2 rounded-md text-xs"
                    onClick={() => setAmount(subTitle)}
                  >
                    Max
                  </Button>
                </div>
              </>
            )}

            {selectedAction === 'claim' && (
              <div className="flex justify-between w-full px-4 mb-2">
                <Button
                  variant="secondary"
                  className="w-full"
                  // TODO: update this entry in the validator list after completion
                  onClick={() => claimRewards(walletState.address, validator.operator_address)}
                >
                  Claim to Wallet
                </Button>
                <Button className="w-full ml-2" onClick={() => claimAndRestake(delegationResponse)}>
                  Claim to Restake
                </Button>
              </div>
            )}
          </div>
        </SlideTray>
      )}
    </>
  );
};
