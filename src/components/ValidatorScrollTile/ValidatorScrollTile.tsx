import { useState } from 'react';
import { CombinedStakingInfo } from '@/types';
import { SlideTray, Button } from '@/ui-kit';
import { LogoIcon, Spinner } from '@/assets/icons';
import { ScrollTile } from '../ScrollTile';
import { WalletSuccessScreen } from '@/components';
import {
  claimAndRestake,
  claimRewards,
  convertToGreaterUnit,
  formatBalanceDisplay,
  isValidUrl,
  selectTextColorByStatus,
  stakeToValidator,
  unstakeFromValidator,
} from '@/helpers';
import { DEFAULT_ASSET, GREATER_EXPONENT_DEFAULT, LOCAL_ASSET_REGISTRY } from '@/constants';
import { useAtomValue } from 'jotai';
import { selectedValidatorsAtom, walletStateAtom } from '@/atoms';
import { AssetInput } from '../AssetInput';
import { LoadingAction } from '@/types';

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
  const [amount, setAmount] = useState(0);
  const [transactionSuccess, setTransactionSuccess] = useState<{ success: boolean; txHash?: string }>({
    success: false,
  });
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);

  const { validator, delegation, balance, rewards } = combinedStakingInfo;
  const delegationResponse = { delegation, balance };

  const symbol = LOCAL_ASSET_REGISTRY.note.symbol || DEFAULT_ASSET.symbol || 'MLD';

  // Aggregating the rewards (sum all reward amounts for this validator)
  const rewardAmount = rewards
    .reduce((sum, reward) => sum + parseFloat(reward.amount), 0)
    .toString();
  const strippedRewardAmount = `${convertToGreaterUnit(
    parseFloat(rewardAmount),
    GREATER_EXPONENT_DEFAULT,
  ).toFixed(GREATER_EXPONENT_DEFAULT)}`;
  const formattedRewardAmount = formatBalanceDisplay(strippedRewardAmount, symbol);

  const delegatedAmount = convertToGreaterUnit(
    parseFloat(delegation.shares || '0'),
    GREATER_EXPONENT_DEFAULT,
  );

  const title = validator.description.moniker || 'Unknown Validator';
  const commission = `${parseFloat(validator.commission.commission_rates.rate) * 100}%`;

  let subTitle: string;
  if (validator.jailed) {
    subTitle = 'Jailed';
  } else if (validator.status === 'BOND_STATUS_UNBONDED') {
    subTitle = 'Inactive';
  } else if (delegatedAmount === 0) {
    subTitle = 'No delegation';
  } else {
    const formattedDelegatedAmount = formatBalanceDisplay(`${delegatedAmount}`, symbol);
    subTitle = `${formattedDelegatedAmount}`;
  }

  const dialogSubTitle = formatBalanceDisplay(
    `${isNaN(delegatedAmount) ? 0 : delegatedAmount}`,
    symbol,
  );

  // TODO: pull dynamically from the validator
  const unbondingDays = 12;

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

  const handleStake = async (amount: string) => {
    setLoadingAction('stake');
    try {
      const result = await stakeToValidator(
        amount,
        LOCAL_ASSET_REGISTRY.note.denom,
        walletState.address,
        validator.operator_address,
      );
      
      console.log('Stake result:', result);
      
      if (result.success && result.data?.code === 0) {
        setTransactionSuccess({ 
          success: true, 
          txHash: result.data.txHash 
        });
      } else {
        console.warn('Stake failed with code:', result.data?.code);
        console.warn('Error message:', result.message || 'No error message provided');
      }
    } catch (error) {
      console.error('Error during staking:', error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleUnstake = async (amount: string) => {
    setLoadingAction('unstake');
    try {
      const result = await unstakeFromValidator(amount, delegationResponse);
      
      console.log('Unstake result:', result);
      
      if (result.success && result.data?.code === 0) {
        setTransactionSuccess({ 
          success: true, 
          txHash: result.data.txHash 
        });
      } else {
        console.warn('Unstake failed with code:', result.data?.code);
        console.warn('Error message:', result.message || 'No error message provided');
      }
    } catch (error) {
      console.error('Error during unstaking:', error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleClaimToWallet = async () => {
    setLoadingAction('claim-wallet');
    try {
      const result = await claimRewards(walletState.address, validator.operator_address);
      
      console.log('Claim to wallet result:', result);
      
      if (result.success && result.data?.code === 0) {
        setTransactionSuccess({ 
          success: true, 
          txHash: result.data.txHash 
        });
      } else {
        console.warn('Claim to wallet failed with code:', result.data?.code);
        console.warn('Error message:', result.message || 'No error message provided');
      }
    } catch (error) {
      console.error('Error claiming rewards:', error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleClaimAndRestake = async () => {
    setLoadingAction('claim-restake');
    try {
      const result = await claimAndRestake(delegationResponse, [{
        validator: validator.operator_address,
        rewards: rewards
      }]);
      
      console.log('Claim and restake result:', result);
      
      if (result.success && result.data?.code === 0) {
        setTransactionSuccess({ 
          success: true, 
          txHash: result.data.txHash 
        });
      } else {
        console.warn('Claim and restake failed with code:', result.data?.code);
        console.warn('Error message:', result.message || 'No error message provided');
      }
    } catch (error) {
      console.error('Error claiming and restaking:', error);
    } finally {
      setLoadingAction(null);
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
          {transactionSuccess.success ? (
            <div className="fixed top-0 left-0 w-screen h-screen z-[9999] bg-black">
              <WalletSuccessScreen 
                caption="Transaction success!" 
                txHash={transactionSuccess.txHash}
              />
            </div>
          ) : (
            <>
              {rewards && (
                <div className="text-center mb-2">
                  <div className="truncate text-base font-medium text-neutral-1">
                    Reward: <span className="text-blue">{formattedRewardAmount}</span>
                  </div>
                  <span className="text-grey-dark text-xs text-base">
                    Unstaking period <span className="text-warning">{unbondingDays} days</span>
                  </span>
                </div>
              )}

              {/* TODO: on button press, animate collapse to 1 line / re-expansion? */}
              {/* Validator Information */}
              <div className="mb-4 min-h-[7.5rem] max-h-[7.5rem] overflow-hidden shadow-md bg-black p-2">
                <p>
                  <strong>Status: </strong>
                  <span className={textColor}>{statusLabel}</span>
                </p>
                <p>
                  <strong>Amount Staked:</strong>{' '}
                  <span className="text-blue line-clamp-1">{dialogSubTitle}</span>
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
                  <Button 
                    className="w-full" 
                    onClick={() => setSelectedAction('stake')}
                    disabled={loadingAction !== null}
                  >
                    Stake
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full mx-2"
                    onClick={() => setSelectedAction('unstake')}
                    disabled={loadingAction !== null}
                  >
                    Unstake
                  </Button>
                  <Button 
                    className="w-full" 
                    onClick={() => setSelectedAction('claim')}
                    disabled={loadingAction !== null}
                  >
                    Claim
                  </Button>
                </div>
              )}

              <div className="flex flex-col items-center justify-center h-[4rem] px-[1.5rem]">
                {(selectedAction === 'stake' || selectedAction === 'unstake') && (
                  <>
                    <div className="flex items-center w-full">
                      <div className="flex-grow mr-2">
                        <AssetInput
                          placeholder="Enter amount"
                          variant="stake"
                          assetState={DEFAULT_ASSET}
                          amountState={amount}
                          updateAmount={newAmount => setAmount(newAmount)}
                        />
                      </div>
                      <Button
                        size="sm"
                        className="ml-2 px-2 py-1 rounded-md w-16"
                        disabled={loadingAction !== null}
                        onClick={() => {
                          selectedAction === 'stake'
                            ? handleStake(amount.toString())
                            : handleUnstake(amount.toString());
                        }}
                      >
                        {loadingAction === 'stake' || loadingAction === 'unstake' ? (
                          <Spinner className="h-4 w-4 animate-spin fill-blue" />
                        ) : selectedAction === 'stake' ? (
                          'Stake'
                        ) : (
                          'Unstake'
                        )}
                      </Button>
                    </div>
                    <div className="flex justify-between w-full mt-1">
                      <Button
                        size="xs"
                        variant="unselected"
                        className="px-2 rounded-md text-xs"
                        disabled={loadingAction !== null}
                        onClick={() => setAmount(0)}
                      >
                        Clear
                      </Button>
                      <Button
                        size="xs"
                        variant="unselected"
                        className="px-2 rounded-md text-xs"
                        disabled={loadingAction !== null}
                        onClick={() => setAmount(delegatedAmount)}
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
                      disabled={loadingAction !== null}
                      onClick={handleClaimToWallet}
                    >
                      {loadingAction === 'claim-wallet' ? (
                        <Spinner className="h-4 w-4 animate-spin fill-blue" />
                      ) : (
                        'Claim to Wallet'
                      )}
                    </Button>
                    <Button 
                      className="w-full ml-2"
                      disabled={loadingAction !== null}
                      onClick={handleClaimAndRestake}
                    >
                      {loadingAction === 'claim-restake' ? (
                        <Spinner className="h-4 w-4 animate-spin fill-blue" />
                      ) : (
                        'Claim to Restake'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SlideTray>
      )}
    </>
  );
};