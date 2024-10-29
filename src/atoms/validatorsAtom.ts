import { CombinedStakingInfo } from '@/types';
import { atom } from 'jotai';
import {
  validatorSortOrderAtom,
  validatorSortTypeAtom,
  searchTermAtom,
  dialogSearchTermAtom,
  validatorDialogSortOrderAtom,
  validatorDialogSortTypeAtom,
} from '@/atoms';
import { filterAndSortValidators } from '@/helpers';
import { ValidatorStatusFilter } from '@/constants';

export const showCurrentValidatorsAtom = atom<boolean>(true);
export const validatorDataAtom = atom<CombinedStakingInfo[]>([]);
export const selectedValidatorsAtom = atom<CombinedStakingInfo[]>([]);
export const validatorStatusFilterAtom = atom<ValidatorStatusFilter>(
  ValidatorStatusFilter.STATUS_ACTIVE,
);

export const filteredValidatorsAtom = atom(get => {
  const validatorData = get(validatorDataAtom);
  const searchTerm = get(searchTermAtom);
  const sortOrder = get(validatorSortOrderAtom);
  const sortType = get(validatorSortTypeAtom);
  const showCurrentValidators = get(showCurrentValidatorsAtom);
  const statusFilter = get(validatorStatusFilterAtom);

  return filterAndSortValidators(
    validatorData,
    searchTerm,
    sortType,
    sortOrder,
    showCurrentValidators,
    statusFilter,
  );
});

export const filteredDialogValidatorsAtom = atom(get => {
  const validatorData = get(validatorDataAtom);
  const searchTerm = get(dialogSearchTermAtom);
  const sortOrder = get(validatorDialogSortOrderAtom);
  const sortType = get(validatorDialogSortTypeAtom);
  const statusFilter = get(validatorStatusFilterAtom);

  return filterAndSortValidators(
    validatorData,
    searchTerm,
    sortType,
    sortOrder,
    true,
    statusFilter,
  );
});
