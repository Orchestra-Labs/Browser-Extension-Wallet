import React, { useState } from 'react';
import { Button, SlideTray } from '@/ui-kit';
import { TileScroller } from '../TileScroller';
import { SortDialog } from '../SortDialog';
import { Spinner } from '@/assets/icons';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  dialogSearchTermAtom,
  filteredDialogValidatorsAtom,
  selectedValidatorsAtom,
  validatorDialogSortOrderAtom,
  validatorDialogSortTypeAtom,
} from '@/atoms';
import { SearchBar } from '../SearchBar';
import { claimAndRestake, claimRewards, unstakeFromAllValidators } from '@/helpers';
import { CombinedStakingInfo } from '@/types';
import { WalletSuccessScreen } from '@/components';
import { LoadingAction } from '@/types';

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
  const setSearchTerm = useSetAtom(dialogSearchTermAtom);
  const setSortOrder = useSetAtom(validatorDialogSortOrderAtom);
  const setSortType = useSetAtom(validatorDialogSortTypeAtom);
  const [selectedValidators, setSelectedValidators] = useAtom(selectedValidatorsAtom);
  const filteredValidators = useAtomValue(filteredDialogValidatorsAtom);
  const [transactionSuccess, setTransactionSuccess] = useState<{
    success: boolean;
    txHash?: string;
  }>({
    success: false,
  });
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null);

  const allValidatorsSelected = selectedValidators.length === filteredValidators.length;
  const noValidatorsSelected = selectedValidators.length === 0;

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
    setLoadingAction('claim-wallet');
    try {
      const result = await claimRewards(
        filteredValidators[0].delegation.delegator_address,
        selectedValidators.map(v => v.delegation.validator_address),
      );

      console.log('Claim to wallet result:', result);

      if (result.success && result.data?.code === 0) {
        setTransactionSuccess({
          success: true,
          txHash: result.data.txHash,
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
        setTransactionSuccess({
          success: true,
          txHash: result.data.txHash,
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

  const handleUnstake = async () => {
    setLoadingAction('unstake');
    try {
      const result = await unstakeFromAllValidators(selectedValidators);

      console.log('Unstake result:', result);

      if (result.success && result.data?.code === 0) {
        setTransactionSuccess({
          success: true,
          txHash: result.data.txHash,
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

  return (
    <SlideTray
      triggerComponent={
        <Button variant={buttonVariant} className="w-full">
          {buttonText}
        </Button>
      }
      title={isClaimDialog ? 'Claim' : 'Unstake'}
      onClose={resetDefaults}
      showBottomBorder
    >
      {transactionSuccess.success ? (
        <div className="fixed top-0 left-0 w-screen h-screen z-[9999] bg-black">
          <WalletSuccessScreen caption="Transaction success!" txHash={transactionSuccess.txHash} />
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {isClaimDialog && (
            <div className="flex justify-between space-x-4">
              <Button
                size="small"
                variant="secondary"
                className="w-full"
                disabled={selectedValidators.length === 0 || loadingAction !== null}
                onClick={handleClaimToWallet}
              >
                {loadingAction === 'claim-wallet' ? (
                  <Spinner className="h-4 w-4 animate-spin fill-blue" />
                ) : (
                  'To Wallet'
                )}
              </Button>
              <Button
                size="small"
                className="w-full"
                disabled={selectedValidators.length === 0 || loadingAction !== null}
                onClick={handleClaimAndRestake}
              >
                {loadingAction === 'claim-restake' ? (
                  <Spinner className="h-4 w-4 animate-spin fill-blue" />
                ) : (
                  'To Restake'
                )}
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
                disabled={loadingAction !== null}
              >
                All
              </Button>
              <p className="text-sm px-1">/</p>
              <Button
                variant={noValidatorsSelected ? 'selected' : 'unselected'}
                size="xsmall"
                className="px-1 rounded-md text-xs"
                onClick={handleSelectNone}
                disabled={loadingAction !== null}
              >
                None
              </Button>
            </div>
            <div className="flex-1 flex justify-end">
              <SortDialog isValidatorSort isDialog />
            </div>
          </div>

          <TileScroller
            activeIndex={1}
            onSelectValidator={handleValidatorSelect}
            isSelectable
            isDialog
          />

          <SearchBar isDialog isValidatorSearch />

          {!isClaimDialog && (
            <div className="flex justify-center space-x-4">
              <Button
                variant="secondary"
                size="small"
                className="mb-1 w-[44%] h-8"
                disabled={selectedValidators.length === 0 || loadingAction !== null}
                onClick={handleUnstake}
              >
                {loadingAction === 'unstake' ? (
                  <Spinner className="h-4 w-4 animate-spin fill-blue" />
                ) : (
                  'Unstake'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </SlideTray>
  );
};
