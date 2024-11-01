import React, { useEffect, useRef, useState } from 'react';
import { Button, SlideTray } from '@/ui-kit';
import { TileScroller } from '../TileScroller';
import { SortDialog } from '../SortDialog';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  dialogSearchTermAtom,
  filteredDialogValidatorsAtom,
  selectedValidatorsAtom,
  validatorDialogSortOrderAtom,
  validatorDialogSortTypeAtom,
  walletStateAtom,
} from '@/atoms';
import { SearchBar } from '../SearchBar';
import {
  claimAndRestake,
  claimRewards,
  formatBalanceDisplay,
  stakeToValidator,
  truncateWalletAddress,
  unstakeFromValidator,
} from '@/helpers';
import { CombinedStakingInfo } from '@/types';
import { useToast } from '@/hooks';
import {
  DEFAULT_ASSET,
  GREATER_EXPONENT_DEFAULT,
  LOCAL_ASSET_REGISTRY,
  TransactionType,
} from '@/constants';
import { WalletSuccessTile } from '../WalletSuccessTile';
import { Loader } from '../Loader';

interface ValidatorSelectDialogProps {
  buttonText: string;
  buttonVariant?: string;
  isClaimDialog?: boolean;
}

export const ValidatorSelectDialog: React.FC<ValidatorSelectDialogProps> = ({
  buttonText,
  buttonVariant,
  isClaimDialog = false,
}) => {
  const { toast } = useToast();
  const slideTrayRef = useRef<{ isOpen: () => void }>(null);

  const { address } = useAtomValue(walletStateAtom);
  const setSearchTerm = useSetAtom(dialogSearchTermAtom);
  const setSortOrder = useSetAtom(validatorDialogSortOrderAtom);
  const setSortType = useSetAtom(validatorDialogSortTypeAtom);
  const [selectedValidators, setSelectedValidators] = useAtom(selectedValidatorsAtom);
  const filteredValidators = useAtomValue(filteredDialogValidatorsAtom);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSlideTrayOpen, setIsSlideTrayOpen] = useState(false);
  const [transactionSuccess, setTransactionSuccess] = useState<{
    transactionType?: TransactionType;
    success: boolean;
    txHash?: string;
  }>({
    success: false,
  });
  const [simulatedFee, setSimulatedFee] = useState<{
    fee: string;
    textClass: 'text-error' | 'text-warn' | 'text-blue';
  } | null>({ fee: '0 MLD', textClass: 'text-blue' });

  const allValidatorsSelected = selectedValidators.length === filteredValidators.length;
  const noValidatorsSelected = selectedValidators.length === 0;

  // TODO: change per chain, not per validator.  current solution can return 0.  innaccurate.
  const unbondingDays = `${filteredValidators[0]?.stakingParams?.unbonding_time || 0} days`;
  const slideTrayIsOpen = slideTrayRef.current && slideTrayRef.current.isOpen();

  const calculateTotalRewards = () => {
    return selectedValidators.reduce((sum, validator) => {
      const totalReward = validator.rewards.reduce(
        (rewardSum, reward) => rewardSum + parseFloat(reward.amount),
        0,
      );
      return sum + totalReward;
    }, 0);
  };

  const calculateTotalDelegations = () => {
    return selectedValidators.reduce(
      (sum, validator) => sum + parseFloat(validator.delegation.shares || '0'),
      0,
    );
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

  const resetDefaults = () => {
    setSearchTerm('');
    setSortOrder('Desc');
    setSortType('name');
    setSelectedValidators([]);
  };

  const handleSelectAll = () => {
    setSelectedValidators(filteredValidators);
  };

  const handleSelectNone = () => {
    setSelectedValidators([]);
  };

  const handleValidatorSelect = (validator: CombinedStakingInfo) => {
    setSelectedValidators(prev =>
      prev.some(v => v.delegation.validator_address === validator.delegation.validator_address)
        ? prev.filter(
            v => v.delegation.validator_address !== validator.delegation.validator_address,
          )
        : [...prev, validator],
    );
  };

  // TODO: non-simulation transactions not going through.  find out why
  // TODO: need to bundle transactions for the all if greater than 29 (set to 20 to be safe).  one bundle per block
  const handleClaimToWallet = async (isSimulation: boolean = false) => {
    if (!isSimulation) setAsLoading(TransactionType.CLAIM_TO_WALLET);

    try {
      const result = await claimRewards(
        filteredValidators[0].delegation.delegator_address,
        selectedValidators.map(v => v.delegation.validator_address),
        isSimulation,
      );

      if (isSimulation) {
        console.log(
          'Claim to wallet simulation result:',
          result.data?.gasWanted || 'No fee available',
        );
        return result;
      }

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
      if (!isSimulation) setIsLoading(false);
    }
  };

  const handleClaimAndRestake = async (isSimulation: boolean = false) => {
    if (!isSimulation) setAsLoading(TransactionType.CLAIM_TO_RESTAKE);

    try {
      const validatorRewards = selectedValidators.map(v => ({
        validator: v.delegation.validator_address,
        rewards: v.rewards,
      }));

      const claimResult = await claimAndRestake(
        selectedValidators.map(v => ({
          delegation: v.delegation,
          balance: v.balance,
        })),
        validatorRewards,
      );

      if (isSimulation) {
        console.log(
          'Claim and restake simulation result (claim part):',
          claimResult.data?.gasWanted || 'No fee available',
        );
        return claimResult;
      }

      if (!claimResult.success || claimResult.data?.code !== 0) {
        console.warn('Claim part failed, stopping restake.');
        return claimResult;
      }

      if (claimResult.success && claimResult.data?.code === 0) {
        const txHash = claimResult.data.txHash as string;
        handleTransactionSuccess(txHash);
      } else {
        console.warn('Claim and restake failed with code:', claimResult.data?.code);
        console.warn('Error message:', claimResult.message || 'No error message provided');
      }
    } catch (error) {
      console.error('Error claiming and restaking:', error);
    } finally {
      if (!isSimulation) setIsLoading(false);
    }
  };

  const handleUnstake = async (simulateOnly: boolean = false) => {
    if (!simulateOnly) setAsLoading(TransactionType.UNSTAKE);

    const delegations = selectedValidators.map(validator => ({
      delegation: validator.delegation,
      balance: validator.balance,
    }));

    try {
      const result = await unstakeFromValidator({
        delegations: delegations,
        simulateOnly,
      });

      if (simulateOnly) {
        console.log('Unstake simulation fee:', result.data?.gasWanted || 'No fee available');
        return result;
      }

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
      if (!simulateOnly) setIsLoading(false);
    }
  };

  const formatFee = (amount: number, gasWanted: number) => {
    const defaultGasPrice = 0.025;
    const exponent = GREATER_EXPONENT_DEFAULT;
    const symbol = DEFAULT_ASSET.symbol || 'MLD';
    const feeAmount = gasWanted * defaultGasPrice;
    const feeInGreaterUnit = feeAmount / Math.pow(10, exponent);

    // Calculate against stake or unstake input or rewards amount
    let feePercentage = 0;
    if (isClaimDialog) {
      feePercentage = feeInGreaterUnit ? (feeInGreaterUnit / amount) * 100 : 0;
    } else {
      feePercentage = feeInGreaterUnit ? (feeInGreaterUnit / amount) * 100 : 0;
    }

    setSimulatedFee({
      fee: formatBalanceDisplay(feeInGreaterUnit.toFixed(exponent), symbol),
      textClass:
        feePercentage > 1 ? 'text-error' : feePercentage > 0.75 ? 'text-warn' : 'text-blue',
    });
  };

  const updateFee = async () => {
    console.log('no validators selected?', noValidatorsSelected);
    if (noValidatorsSelected) {
      console.log('No validators selected, skipping fee update.');
      return;
    }
    try {
      console.log('Starting fee update with selectedValidators:', selectedValidators);
      let totalAmount = 0;
      let simulationResult;

      if (isClaimDialog) {
        totalAmount = calculateTotalRewards();
        simulationResult = await handleClaimToWallet(true);
        console.log(
          'Claim to wallet simulation fee:',
          simulationResult?.data?.gasWanted || 'No fee available',
        );
        if (!simulationResult?.success || !simulationResult.data) return;
        const restakeSimulationResult = await stakeToValidator(
          totalAmount.toString(),
          LOCAL_ASSET_REGISTRY.note.denom,
          address,
          selectedValidators[0].validator.operator_address,
          true,
        );
        console.log(
          'Restake simulation fee:',
          restakeSimulationResult.data?.gasWanted || 'No fee available',
        );
        formatFee(totalAmount, parseFloat(simulationResult?.data.gasWanted || '0'));
      } else {
        totalAmount = calculateTotalDelegations();
        simulationResult = await handleUnstake(true);
        console.log(
          'Unstake simulation fee:',
          simulationResult?.data?.gasWanted || 'No fee available',
        );
        formatFee(totalAmount, parseFloat(simulationResult?.data?.gasWanted || '0'));
      }
    } catch (error) {
      console.error('Simulation error:', error);
    }
  };

  useEffect(() => {
    console.log('slide tray is open', slideTrayIsOpen);
    if (slideTrayIsOpen) updateFee();
  }, [slideTrayIsOpen, selectedValidators]);

  return (
    <SlideTray
      ref={slideTrayRef}
      triggerComponent={
        <Button variant={buttonVariant} className="w-full" onClick={() => setIsSlideTrayOpen(true)}>
          {buttonText}
        </Button>
      }
      title={isClaimDialog ? 'Claim' : 'Unstake'}
      onClose={resetDefaults}
      showBottomBorder
      reducedTopMargin={!isClaimDialog}
    >
      <div className="flex flex-col h-full">
        {!isClaimDialog && (
          <div className="text-center">
            <span className="text-grey-dark text-xs text-base">
              Unstaking period <span className="text-warning">{unbondingDays}</span>
            </span>
          </div>
        )}

        {isClaimDialog && (
          <div className="flex justify-between space-x-4">
            <Button
              size="small"
              variant="secondary"
              className="w-full"
              disabled={selectedValidators.length === 0 || isLoading}
              onClick={() => handleClaimToWallet}
            >
              To Wallet
            </Button>
            <Button
              size="small"
              className="w-full"
              disabled={selectedValidators.length === 0 || isLoading}
              onClick={() => handleClaimAndRestake}
            >
              To Restake
            </Button>
          </div>
        )}

        <div className="flex justify-between items-center px-2">
          <div className="flex-1 text-sm">Tap to select</div>
          <div className="flex items-center">
            <p className="text-sm pr-1">Select:</p>
            <Button
              variant={allValidatorsSelected ? 'selected' : 'unselected'}
              size="xsmall"
              className="px-1 rounded-md text-xs"
              onClick={handleSelectAll}
              disabled={isLoading}
            >
              All
            </Button>
            <p className="text-sm px-1">/</p>
            <Button
              variant={noValidatorsSelected ? 'selected' : 'unselected'}
              size="xsmall"
              className="px-1 rounded-md text-xs"
              onClick={handleSelectNone}
              disabled={isLoading}
            >
              None
            </Button>
          </div>
          <div className="flex-1 flex justify-end">
            <SortDialog isValidatorSort isDialog />
          </div>
        </div>

        {transactionSuccess.success || isLoading ? (
          <div className="flex flex-col flex-grow w-full border border-neutral-3 rounded-md items-center justify-center px-[1.5rem]">
            {isLoading ? (
              // TODO: scale up size for this.  add variants
              <div className="flex items-center px-4">
                <Loader showBackground={false} />
              </div>
            ) : (
              <WalletSuccessTile
                txHash={truncateWalletAddress('', transactionSuccess.txHash as string)}
                size="md"
              />
            )}
          </div>
        ) : (
          <TileScroller
            activeIndex={1}
            onSelectValidator={handleValidatorSelect}
            isSelectable
            isDialog
          />
        )}

        <SearchBar isDialog isValidatorSearch />

        {!isClaimDialog && (
          <div className="flex justify-center space-x-4">
            <Button
              variant="secondary"
              size="small"
              className="mb-1 w-[44%] h-8"
              disabled={selectedValidators.length === 0 || isLoading}
              onClick={() => handleUnstake}
            >
              Unstake
            </Button>
          </div>
        )}

        {/* Fee Section */}
        <div className="flex flex-grow" />
        <div className="flex justify-between items-center text-blue text-sm font-bold w-full">
          <p>Fee</p>
          <p className={simulatedFee?.textClass}>
            {simulatedFee && !noValidatorsSelected ? simulatedFee.fee : '-'}
          </p>
        </div>
      </div>
    </SlideTray>
  );
};
