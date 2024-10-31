import { useState } from 'react';
import { CombinedStakingInfo } from '@/types';
import { SlideTray, Button } from '@/ui-kit';
import { LogoIcon } from '@/assets/icons';
import { ScrollTile } from '../ScrollTile';
import {
  claimAndRestake,
  claimRewards,
  convertToGreaterUnit,
  formatBalanceDisplay,
  isValidUrl,
  selectTextColorByStatus,
  stakeToValidator,
  truncateWalletAddress,
  unstakeFromValidator,
} from '@/helpers';
import {
  DEFAULT_ASSET,
  GREATER_EXPONENT_DEFAULT,
  LOCAL_ASSET_REGISTRY,
  TransactionType,
} from '@/constants';
import { useAtomValue } from 'jotai';
import { selectedValidatorsAtom, walletStateAtom } from '@/atoms';
import { AssetInput } from '../AssetInput';
import { Loader } from '../Loader';
import { useToast } from '@/hooks';
import { WalletSuccessTile } from '../WalletSuccessTile';

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
  const { toast } = useToast();

  const selectedValidators = useAtomValue(selectedValidatorsAtom);
  const walletState = useAtomValue(walletStateAtom);

  const [amount, setAmount] = useState(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSlideTrayOpen, setIsSlideTrayOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'stake' | 'unstake' | 'claim' | null>(
    !combinedStakingInfo.delegation ? 'stake' : null,
  );
  const [transactionSuccess, setTransactionSuccess] = useState<{
    transactionType?: TransactionType;
    success: boolean;
    txHash?: string;
  }>({
    success: false,
  });

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

  const setAsLoading = (transactionType: TransactionType) => {
    setIsLoading(true);
    setTransactionSuccess(prev => ({
      ...prev,
      transactionType: transactionType,
    }));
  };

  const handleTransactionSuccess = (txHash: string) => {
    if (isSlideTrayOpen) {
      setSelectedAction(null);
      setTransactionSuccess(prev => ({
        ...prev,
        success: true,
        txHash,
      }));

      // Set timeout to reset success state after 3 seconds (3000 ms)
      setTimeout(() => {
        setTransactionSuccess(prev => ({
          ...prev,
          success: false,
        }));
      }, 3000);
    } else {
      // TODO: toast not displaying.  find out why and fix
      const displayTransactionHash = truncateWalletAddress('', transactionSuccess.txHash as string);

      toast({
        title: `${transactionSuccess.transactionType} success!`,
        description: `Transaction hash ${displayTransactionHash} has been copied.`,
      });

      setTransactionSuccess(prev => ({
        ...prev,
        success: false,
      }));
    }
  };

  const handleStake = async (amount: string) => {
    setAsLoading(TransactionType.STAKE);

    try {
      const result = await stakeToValidator(
        amount,
        LOCAL_ASSET_REGISTRY.note.denom,
        walletState.address,
        validator.operator_address,
      );

      console.log('Stake result:', result);

      if (result.success && result.data?.code === 0) {
        const txHash = result.data.txHash as string;
        handleTransactionSuccess(txHash);
      } else {
        console.warn('Stake failed with code:', result.data?.code);
        console.warn('Error message:', result.message || 'No error message provided');
      }
    } catch (error) {
      console.error('Error during staking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnstake = async (amount: string) => {
    setAsLoading(TransactionType.UNSTAKE);

    try {
      const result = await unstakeFromValidator(amount, delegationResponse);

      console.log('Unstake result:', result);

      if (result.success && result.data?.code === 0) {
        const txHash = result.data.txHash as string;
        handleTransactionSuccess(txHash);
      } else {
        console.warn('Unstake failed with code:', result.data?.code);
        console.warn('Error message:', result.message || 'No error message provided');
      }
    } catch (error) {
      console.error('Error during unstaking:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimToWallet = async () => {
    setAsLoading(TransactionType.CLAIM_TO_WALLET);

    try {
      const result = await claimRewards(walletState.address, validator.operator_address);

      console.log('Claim to wallet result:', result);

      if (result.success && result.data?.code === 0) {
        const txHash = result.data.txHash as string;
        handleTransactionSuccess(txHash);
      } else {
        console.warn('Claim to wallet failed with code:', result.data?.code);
        console.warn('Error message:', result.message || 'No error message provided');
      }
    } catch (error) {
      console.error('Error claiming rewards:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimAndRestake = async () => {
    setAsLoading(TransactionType.CLAIM_TO_RESTAKE);

    try {
      const result = await claimAndRestake(delegationResponse, [
        {
          validator: validator.operator_address,
          rewards: rewards,
        },
      ]);

      console.log('Claim and restake result:', result);

      if (result.success && result.data?.code === 0) {
        const txHash = result.data.txHash as string;
        handleTransactionSuccess(txHash);
      } else {
        console.warn('Claim and restake failed with code:', result.data?.code);
        console.warn('Error message:', result.message || 'No error message provided');
      }
    } catch (error) {
      console.error('Error claiming and restaking:', error);
    } finally {
      setIsLoading(false);
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
                onClick={() => setIsSlideTrayOpen(true)}
              />
            </div>
          }
          title={title}
          showBottomBorder
          status={statusColor}
          onClose={() => setIsSlideTrayOpen(false)}
        >
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
              <p className="line-clamp-1">
                <strong>Amount Staked:</strong> <span className="text-blue">{dialogSubTitle}</span>
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
                  disabled={isLoading}
                >
                  Stake
                </Button>
                <Button
                  variant="secondary"
                  className="w-full mx-2"
                  onClick={() => setSelectedAction('unstake')}
                  disabled={isLoading}
                >
                  Unstake
                </Button>
                <Button
                  className="w-full"
                  onClick={() => setSelectedAction('claim')}
                  disabled={isLoading}
                >
                  Claim
                </Button>
              </div>
            )}

            <div className="flex flex-col items-center justify-center h-[4rem] px-[1.5rem]">
              {transactionSuccess.success && (
                <WalletSuccessTile
                  txHash={truncateWalletAddress('', transactionSuccess.txHash as string)}
                />
              )}

              {isLoading && (
                <div className="flex items-center px-4">
                  <Loader showBackground={false} />
                </div>
              )}

              {!isLoading && (selectedAction === 'stake' || selectedAction === 'unstake') && (
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
                      disabled={isLoading}
                      onClick={() => {
                        selectedAction === 'stake'
                          ? handleStake(amount.toString())
                          : handleUnstake(amount.toString());
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
                      disabled={isLoading}
                      onClick={() => setAmount(0)}
                    >
                      Clear
                    </Button>
                    <Button
                      size="xs"
                      variant="unselected"
                      className="px-2 rounded-md text-xs"
                      disabled={isLoading}
                      onClick={() => setAmount(delegatedAmount)}
                    >
                      Max
                    </Button>
                  </div>
                </>
              )}

              {!isLoading && selectedAction === 'claim' && (
                <div className="flex justify-between w-full px-4 mb-2">
                  <Button
                    variant="secondary"
                    className="w-full"
                    disabled={isLoading}
                    onClick={handleClaimToWallet}
                  >
                    Claim to Wallet
                  </Button>
                  <Button
                    className="w-full ml-2"
                    disabled={isLoading}
                    onClick={handleClaimAndRestake}
                  >
                    Claim to Restake
                  </Button>
                </div>
              )}
            </div>
          </>
        </SlideTray>
      )}
    </>
  );
};
