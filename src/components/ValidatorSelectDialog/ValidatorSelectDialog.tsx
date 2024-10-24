import React from 'react';
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
import { claimAndRestake, claimRewards, unstakeFromAllValidators } from '@/helpers';
import { CombinedStakingInfo } from '@/types';

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
      <div className="flex flex-col h-full">
        {isClaimDialog && (
          <div className="flex justify-between space-x-4">
            <Button
              size="small"
              variant="secondary"
              className="w-full"
              disabled={selectedValidators.length === 0}
              onClick={() => {
                console.log('Claiming rewards for selected validators:', selectedValidators);
                claimRewards(
                  filteredValidators[0].delegation.delegator_address,
                  selectedValidators.map(v => v.delegation.validator_address),
                );
              }}
            >
              To Wallet
            </Button>
            <Button
              size="small"
              className="w-full"
              disabled={selectedValidators.length === 0}
              onClick={() => {
                console.log('Claiming and restaking for selected validators:', selectedValidators);
                claimAndRestake(selectedValidators);
              }}
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
            >
              All
            </Button>
            <p className="text-sm px-1">/</p>
            <Button
              variant={noValidatorsSelected ? 'selected' : 'unselected'}
              size="xsmall"
              className="px-1 rounded-md text-xs"
              onClick={handleSelectNone}
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
              disabled={selectedValidators.length === 0}
              onClick={() => {
                console.log('Unstaking selected validators:', selectedValidators);
                unstakeFromAllValidators(selectedValidators);
              }}
            >
              Unstake
            </Button>
          </div>
        )}
      </div>
    </SlideTray>
  );
};
