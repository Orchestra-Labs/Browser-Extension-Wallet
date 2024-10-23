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
import {
  claimRewardsFromAllValidators,
  claimAndRestakeAll,
  unstakeFromAllValidators,
} from '@/helpers';
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
              onClick={() =>
                claimRewardsFromAllValidators(
                  filteredValidators[0].delegation.delegator_address,
                  selectedValidators.map(v => v.delegation.validator_address),
                )
              }
            >
              To Wallet
            </Button>
            <Button
              size="small"
              className="w-full"
              disabled={selectedValidators.length === 0}
              onClick={() => {
                claimAndRestakeAll(selectedValidators);
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
              variant="selected"
              size="xsmall"
              className="px-1 rounded-md text-xs"
              onClick={handleSelectAll}
            >
              All
            </Button>
            <p className="text-sm px-1">/</p>
            <Button
              variant="unselected"
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

        {/* Validator selection UI */}
        {/* TODO: within tilescroller, ensure overflow over halfway results in ellipses.  they can click in for more information if needed */}
        <TileScroller
          activeIndex={1}
          addMargin={false}
          onSelectValidator={handleValidatorSelect}
          isSelectable
          isDialog
        />

        <SearchBar isDialog isValidatorSearch />

        {!isClaimDialog && (
          <div className="flex justify-center space-x-4">
            <Button
              variant="secondary"
              className="mb-1 w-[44%]"
              disabled={selectedValidators.length === 0}
              onClick={() => {
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
