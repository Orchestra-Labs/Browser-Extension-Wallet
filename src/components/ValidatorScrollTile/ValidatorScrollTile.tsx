import { useState } from 'react';
import { DelegationResponse, ValidatorInfo } from '@/types';
import { SlideTray, Button, Input } from '@/ui-kit';
import { LogoIcon } from '@/assets/icons';
import { ScrollTile } from '../ScrollTile';
import {
  claimAndRestake,
  claimRewardsFromValidator,
  convertToGreaterUnit,
  isValidUrl,
  removeTrailingZeroes,
  selectTextColorByStatus,
  stakeToValidator,
  unstakeFromValidator,
} from '@/helpers';
import { GREATER_EXPONENT_DEFAULT, LOCAL_ASSET_REGISTRY } from '@/constants';
import { useAtomValue } from 'jotai';
import { walletStateAtom } from '@/atoms';

interface ValidatorScrollTileProps {
  validator: ValidatorInfo;
  delegation?: DelegationResponse;
  reward?: string;
  isSelectable?: boolean;
  addMargin?: boolean;
}

export const ValidatorScrollTile = ({
  validator,
  delegation,
  reward,
  isSelectable = false,
  addMargin = true,
}: ValidatorScrollTileProps) => {
  const [selectedAction, setSelectedAction] = useState<'stake' | 'unstake' | 'claim' | null>(
    // TODO: fix this not coming in on "all" page
    !delegation ? 'stake' : null,
  );
  const walletState = useAtomValue(walletStateAtom);
  const [amount, setAmount] = useState('');

  const delegatedAmount = `${removeTrailingZeroes(delegation ? convertToGreaterUnit(parseFloat(delegation.balance.amount), GREATER_EXPONENT_DEFAULT) : 0)} ${LOCAL_ASSET_REGISTRY.note.symbol}`;

  const title = validator.description.moniker || 'Unknown Validator';
  const subTitle = delegatedAmount || '';
  const rewardAmount = removeTrailingZeroes(reward || '') || '0 MLD';
  const commission = `${parseFloat(validator.commission.commission_rates.rate) * 100}%`;

  const unbondingDays = 12; // TODO: After differentiating by chain, pull dynamically from the validator

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

  const website = validator.description.website;
  const isWebsiteValid = isValidUrl(website);

  return (
    <>
      {isSelectable ? (
        <ScrollTile
          title={title}
          subtitle={subTitle}
          value={rewardAmount}
          icon={<LogoIcon />}
          status={statusColor}
          addMargin={addMargin}
        />
      ) : (
        <SlideTray
          triggerComponent={
            <div>
              <ScrollTile
                title={title}
                subtitle={subTitle}
                value={rewardAmount}
                icon={<LogoIcon />}
                status={statusColor}
                addMargin={addMargin}
              />
            </div>
          }
          title={title}
          showBottomBorder
          status={statusColor}
        >
          {reward && (
            <>
              <div className="text-center mb-2">
                <div className="truncate text-base font-medium text-neutral-1">
                  Reward: <span className="text-blue">{reward}</span>
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
            <div className="flex flex-col items-center justify-center grid grid-cols-3 w-full gap-x-4 px-2">
              <Button className="w-full" onClick={() => setSelectedAction('stake')}>
                Stake
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setSelectedAction('unstake')}
              >
                Unstake
              </Button>
              <Button className="w-full" onClick={() => setSelectedAction('claim')}>
                Claim
              </Button>
            </div>
          )}

          <div className="flex flex-col items-center justify-center h-[4rem]">
            {/* Stake and Unstake Actions */}
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
                        : unstakeFromValidator(amount, delegation as DelegationResponse);
                    }}
                  >
                    {selectedAction === 'stake' ? 'Stake' : 'Unstake'}
                  </Button>
                </div>
              </>
            )}

            {/* Claim Action */}
            {selectedAction === 'claim' && (
              <div className="flex flex-col items-center justify-center grid grid-cols-2 gap-4 mt-[1.5rem]">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() =>
                    // TODO: update this entry in the validator list after completion (fix timing first.  can extract update function from that)
                    claimRewardsFromValidator(walletState.address, validator.operator_address)
                  }
                >
                  Claim to Wallet
                </Button>
                <Button
                  className="w-full"
                  onClick={() => claimAndRestake(delegation as DelegationResponse)}
                >
                  Claim to Restake
                </Button>
              </div>
            )}
          </div>
          {(selectedAction === 'stake' || selectedAction === 'unstake') && (
            <>
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
        </SlideTray>
      )}
    </>
  );
};
