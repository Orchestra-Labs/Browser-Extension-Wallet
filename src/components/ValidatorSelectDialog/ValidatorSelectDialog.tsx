import React, { useState } from 'react';
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
} from '@/atoms';
import { SearchBar } from '../SearchBar';
import {
  claimAndRestake,
  claimRewards,
  truncateWalletAddress,
  unstakeFromAllValidators,
} from '@/helpers';
import { CombinedStakingInfo } from '@/types';
import { useToast } from '@/hooks';
import { TransactionType } from '@/constants';
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

  const allValidatorsSelected = selectedValidators.length === filteredValidators.length;
  const noValidatorsSelected = selectedValidators.length === 0;

  // TODO: change per chain, not per validator.  current solution can return 0.  innaccurate.
  const unbondingDays = `${filteredValidators[0]?.stakingParams?.unbonding_time || 0} days`;

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
    console.log('Resetting defaults');
    setSearchTerm('');
    setSortOrder('Desc');
    setSortType('name');
    setSelectedValidators([]);
  };

  const handleSelectAll = () => {
    console.log('Selecting all validators:', filteredValidators);
    setSelectedValidators(filteredValidators);
  };

  const handleSelectNone = () => {
    console.log('Deselecting all validators');
    setSelectedValidators([]);
  };

  const handleValidatorSelect = (validator: CombinedStakingInfo) => {
    console.log('Toggling selection for validator:', validator);
    setSelectedValidators(prev =>
      prev.some(v => v.delegation.validator_address === validator.delegation.validator_address)
        ? prev.filter(
            v => v.delegation.validator_address !== validator.delegation.validator_address,
          )
        : [...prev, validator],
    );
  };

  const handleClaimToWallet = async () => {
    setAsLoading(TransactionType.CLAIM_TO_WALLET);

    try {
      const result = await claimRewards(
        filteredValidators[0].delegation.delegator_address,
        selectedValidators.map(v => v.delegation.validator_address),
      );

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
      const validatorRewards = selectedValidators.map(v => ({
        validator: v.delegation.validator_address,
        rewards: v.rewards,
      }));

      const result = await claimAndRestake(
        selectedValidators.map(v => ({
          delegation: v.delegation,
          balance: v.balance,
        })),
        validatorRewards,
      );

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

  const handleUnstake = async () => {
    setAsLoading(TransactionType.UNSTAKE);

    try {
      const result = await unstakeFromAllValidators(selectedValidators);

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

  return (
    <SlideTray
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
              onClick={handleClaimToWallet}
            >
              To Wallet
            </Button>
            <Button
              size="small"
              className="w-full"
              disabled={selectedValidators.length === 0 || isLoading}
              onClick={handleClaimAndRestake}
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
              onClick={handleUnstake}
            >
              Unstake
            </Button>
          </div>
        )}
      </div>
    </SlideTray>
  );
};
