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

export const showCurrentValidatorsAtom = atom<boolean>(true);
export const validatorDataAtom = atom<CombinedStakingInfo[]>([]);
export const selectedValidatorsAtom = atom<CombinedStakingInfo[]>([]);

export const filteredValidatorsAtom = atom(get => {
  const validatorData = get(validatorDataAtom);
  const searchTerm = get(searchTermAtom);
  const sortOrder = get(validatorSortOrderAtom);
  const sortType = get(validatorSortTypeAtom);
  const showCurrentValidators = get(showCurrentValidatorsAtom);

  return filterAndSortValidators(
    validatorData,
    searchTerm,
    sortType,
    sortOrder,
    showCurrentValidators,
  );
});

export const filteredDialogValidatorsAtom = atom(get => {
  const validatorData = get(validatorDataAtom);
  const searchTerm = get(dialogSearchTermAtom);
  const sortOrder = get(validatorDialogSortOrderAtom);
  const sortType = get(validatorDialogSortTypeAtom);

  return filterAndSortValidators(validatorData, searchTerm, sortType, sortOrder, true);
});
