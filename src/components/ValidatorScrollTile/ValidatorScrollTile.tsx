import { useEffect, useRef, useState } from 'react';
import { CombinedStakingInfo, TransactionResult } from '@/types';
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
  BondStatus,
  DEFAULT_ASSET,
  GREATER_EXPONENT_DEFAULT,
  LOCAL_ASSET_REGISTRY,
  TransactionType,
} from '@/constants';
import { useAtom, useAtomValue } from 'jotai';
import { selectedValidatorsAtom, shouldRefreshDataAtom, walletStateAtom } from '@/atoms';
import { AssetInput } from '../AssetInput';
import { Loader } from '../Loader';
import { useToast, useValidatorDataRefresh, useWalletAssetsRefresh } from '@/hooks';
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
  const { refreshWalletAssets } = useWalletAssetsRefresh();
  const { refreshValidatorData } = useValidatorDataRefresh();
  const slideTrayRef = useRef<{ isOpen: () => void }>(null);

  const selectedValidators = useAtomValue(selectedValidatorsAtom);
  const walletState = useAtomValue(walletStateAtom);
  const [shouldRefreshData, setShouldRefreshData] = useAtom(shouldRefreshDataAtom);

  const [amount, setAmount] = useState(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isClaimToRestake, setIsClaimToRestake] = useState<boolean>(true);
  const [selectedAction, setSelectedAction] = useState<'stake' | 'unstake' | 'claim' | null>(
    !combinedStakingInfo.delegation ? 'stake' : null,
  );
  const [transactionSuccess, setTransactionSuccess] = useState<{
    success: boolean;
    txHash?: string;
  }>({
    success: false,
  });
  const [simulatedFee, setSimulatedFee] = useState<{
    fee: string;
    textClass: 'text-error' | 'text-warn' | 'text-blue';
  } | null>({ fee: '0 MLD', textClass: 'text-blue' });

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
  const isSelected = selectedValidators.some(
    v => v.delegation.validator_address === combinedStakingInfo.delegation.validator_address,
  );

  const slideTrayIsOpen = slideTrayRef.current && slideTrayRef.current.isOpen();

  let subTitle: string;
  if (validator.jailed) {
    subTitle = 'Jailed';
  } else if (validator.status === BondStatus.UNBONDED) {
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

  const unbondingDays = `${combinedStakingInfo.stakingParams?.unbonding_time} days`;

  let statusLabel = '';
  let statusColor: 'good' | 'warn' | 'error' = 'good';
  if (validator.jailed) {
    statusLabel = 'Jailed';
    statusColor = 'error';
  } else if (validator.status === BondStatus.UNBONDING) {
    statusLabel = 'Unbonding';
    statusColor = 'warn';
  } else if (validator.status === BondStatus.UNBONDED) {
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

  const handleTransactionSuccess = (transactionType: TransactionType, txHash: string) => {
    const slideTrayIsOpen = slideTrayRef.current && slideTrayRef.current.isOpen();

    if (slideTrayIsOpen) {
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
      const displayTransactionHash = truncateWalletAddress('', txHash as string);

      toast({
        title: `${transactionType} success!`,
        description: `Transaction hash ${displayTransactionHash} has been copied.`,
      });

      setTransactionSuccess(prev => ({
        ...prev,
        success: false,
      }));
    }

    setShouldRefreshData(true);
  };

  const handleStake = async (amount: string, isSimulation: boolean = false) => {
    if (!isSimulation) setIsLoading(true);

    try {
      const result = await stakeToValidator(
        amount,
        LOCAL_ASSET_REGISTRY.note.denom,
        walletState.address,
        validator.operator_address,
      );

      if (isSimulation) return result;

      if (result.success && result.data?.code === 0) {
        const txType = TransactionType.STAKE;
        const txHash = result.data.txHash as string;

        handleTransactionSuccess(txType, txHash);
      } else {
        console.warn('Stake transaction failed with code:', result.data?.code);
        console.warn('Error message:', result.message || 'No error message provided');
      }
    } catch (error) {
      console.error('Error during staking:', error);
    } finally {
      if (!isSimulation) setIsLoading(false);
    }
  };

  const handleUnstake = async (amount: string, isSimulation: boolean = false) => {
    if (!isSimulation) setIsLoading(true);

    try {
      const result = await unstakeFromValidator({ amount, delegations: delegationResponse });

      if (isSimulation) return result;

      if (result.success && result.data?.code === 0) {
        const txType = TransactionType.UNSTAKE;
        const txHash = result.data.txHash as string;

        handleTransactionSuccess(txType, txHash);
      } else {
        console.warn('Unstake transaction failed with code:', result.data?.code);
        console.warn('Error message:', result.message || 'No error message provided');
      }
    } catch (error) {
      console.error('Error during unstaking:', error);
    } finally {
      if (!isSimulation) setIsLoading(false);
    }
  };

  const handleClaimToWallet = async (isSimulation: boolean = false) => {
    if (!isSimulation) setIsLoading(true);

    try {
      const result = await claimRewards(walletState.address, validator.operator_address);

      if (isSimulation) return result;

      if (result.success && result.data?.code === 0) {
        const txType = TransactionType.CLAIM_TO_WALLET;
        const txHash = result.data.txHash as string;

        handleTransactionSuccess(txType, txHash);
      } else {
        console.warn('Claim to wallet failed with code:', result.data?.code);
        console.warn('Error message:', result.message || 'No error message provided');
      }
    } catch (error) {
      console.error('Error claiming rewards:', error);
    } finally {
      if (!isSimulation) setIsLoading(false);
    }
  };

  const handleClaimAndRestake = async (isSimulation: boolean = true) => {
    if (!isSimulation) setIsLoading(true);

    try {
      const result = await claimAndRestake(
        delegationResponse,
        [
          {
            validator: validator.operator_address,
            rewards: rewards,
          },
        ],
        isSimulation,
      );

      if (isSimulation) return result;

      if (result.success && result.data?.code === 0) {
        const txType = TransactionType.CLAIM_TO_RESTAKE;
        const txHash = result.data.txHash as string;
        handleTransactionSuccess(txType, txHash);
      } else {
        console.warn('Claim and restake failed with code:', result.data?.code);
        console.warn('Error message:', result.message || 'No error message provided');
      }
    } catch (error) {
      console.error('Error claiming and restaking:', error);
    } finally {
      if (!isSimulation) setIsLoading(false);
    }
  };

  // TODO: extract to utils
  const formatFee = (gasWanted: number) => {
    const defaultGasPrice = 0.025;
    const exponent = GREATER_EXPONENT_DEFAULT;
    const symbol = DEFAULT_ASSET.symbol || 'MLD';
    const feeAmount = gasWanted * defaultGasPrice;
    const feeInGreaterUnit = feeAmount / Math.pow(10, exponent);

    // Calculate against stake or unstake input or rewards amount
    let feePercentage = 0;
    if (selectedAction === 'claim') {
      feePercentage = feeInGreaterUnit ? (feeInGreaterUnit / rewardAmount) * 100 : 0;
    } else if (selectedAction === 'stake' || selectedAction === 'unstake') {
      feePercentage = feeInGreaterUnit ? (feeInGreaterUnit / amount) * 100 : 0;
    }

    setSimulatedFee({
      fee: formatBalanceDisplay(feeInGreaterUnit.toFixed(exponent), symbol),
      textClass:
        feePercentage > 1 ? 'text-error' : feePercentage > 0.75 ? 'text-warn' : 'text-blue',
    });
  };

  // TODO: these are calling claimRewards directly.  move most of that into the actual functions
  const updateFee = async () => {
    if (selectedAction !== 'claim' && (amount === 0 || isNaN(amount))) {
      formatFee(0);
    } else {
      let result = { success: false, message: '', data: { gasWanted: '' } } as TransactionResult;
      try {
        if (selectedAction === 'claim') {
          result = (
            isClaimToRestake ? await handleClaimAndRestake(true) : await handleClaimToWallet(true)
          ) as TransactionResult;
        } else if (selectedAction === 'stake') {
          result = (await handleStake(amount.toString(), true)) as TransactionResult;
        } else if (selectedAction === 'unstake') {
          result = (await handleUnstake(amount.toString(), true)) as TransactionResult;
        }
      } catch (error) {
        console.error('Simulation error:', error);
      }

      formatFee(parseFloat(result.data?.gasWanted || '0'));
    }
  };

  useEffect(() => {
    if (slideTrayIsOpen) updateFee();
  }, [slideTrayIsOpen, selectedAction, amount, isClaimToRestake]);

  useEffect(() => {
    if (shouldRefreshData && transactionSuccess.success) {
      refreshWalletAssets();
      refreshValidatorData();
    }
  }, [transactionSuccess.success]);

  // TODO: clear state on close of slidetray
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
          ref={slideTrayRef}
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
          <div className="flex flex-col h-full">
            {rewards && (
              <div className="text-center mb-2">
                <div className="truncate text-base font-medium text-neutral-1">
                  Reward: <span className="text-blue">{formattedRewardAmount}</span>
                </div>
                <span className="text-grey-dark text-xs text-base">
                  Unstaking period <span className="text-warning">{unbondingDays}</span>
                </span>
              </div>
            )}

            {/* TODO: make scrollable? collapse/expand on button press? if collapse, animate collapse to 1 line / re-expansion */}
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
                  size="medium"
                  className="w-full"
                  onClick={() => setSelectedAction('stake')}
                  disabled={isLoading}
                >
                  Stake
                </Button>
                <Button
                  size="medium"
                  variant="secondary"
                  className="w-full mx-2"
                  onClick={() => setSelectedAction('unstake')}
                  disabled={isLoading}
                >
                  Unstake
                </Button>
                <Button
                  size="medium"
                  className="w-full"
                  onClick={() => setSelectedAction('claim')}
                  disabled={isLoading}
                >
                  Claim
                </Button>
              </div>
            )}

            <div
              className={`flex flex-grow flex-col items-center justify-center ${selectedAction === 'claim' ? '' : 'px-[1.5rem]'}`}
            >
              {transactionSuccess.success && (
                <div className="flex-grow">
                  <WalletSuccessTile
                    size="sm"
                    txHash={truncateWalletAddress('', transactionSuccess.txHash as string)}
                  />
                </div>
              )}

              {isLoading && (
                <div className="flex flex-grow items-center px-4">
                  <Loader showBackground={false} />
                </div>
              )}

              {!isLoading && (selectedAction === 'stake' || selectedAction === 'unstake') && (
                <>
                  <div className="flex items-center w-full">
                    <div className="flex-grow mr-2">
                      <AssetInput
                        placeholder={`Enter ${selectedAction} amount`}
                        variant="stake"
                        assetState={DEFAULT_ASSET}
                        amountState={amount}
                        updateAmount={newAmount => setAmount(newAmount)}
                        reducedHeight
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
                <>
                  <div className="flex justify-between items-center text-sm font-bold w-full">
                    <p className="text-sm pr-1">Claim:</p>
                    <div className="flex items-center">
                      <Button
                        variant={!isClaimToRestake ? 'selected' : 'unselected'}
                        size="xsmall"
                        className="px-1 rounded-md text-xs"
                        onClick={() => setIsClaimToRestake(false)}
                        disabled={isLoading}
                      >
                        To Wallet
                      </Button>
                      <p className="text-sm px-1">/</p>
                      <Button
                        variant={isClaimToRestake ? 'selected' : 'unselected'}
                        size="xsmall"
                        className="px-1 rounded-md text-xs"
                        onClick={() => setIsClaimToRestake(true)}
                        disabled={isLoading}
                      >
                        To Restake
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center flex-grow justify-center w-[50%] px-4">
                    <Button
                      size="small"
                      variant="secondary"
                      className="w-full"
                      disabled={isLoading}
                      onClick={() =>
                        isClaimToRestake ? handleClaimAndRestake(false) : handleClaimToWallet(false)
                      }
                    >
                      {`Claim ${isClaimToRestake ? 'to Restake' : 'to Wallet'}`}
                    </Button>
                  </div>
                </>
              )}
            </div>

            {/* Fee Section */}
            <div className="flex justify-between items-center text-blue text-sm font-bold w-full">
              <p>Fee</p>
              <p className={simulatedFee?.textClass}>
                {simulatedFee && selectedAction ? simulatedFee.fee : '-'}
              </p>
            </div>
          </div>
        </SlideTray>
      )}
    </>
  );
};
