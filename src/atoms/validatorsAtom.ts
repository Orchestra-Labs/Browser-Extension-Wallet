import { CombinedStakingInfo } from '@/types';
import { atom } from 'jotai';
import { validatorSortOrderAtom, validatorSortTypeAtom, searchTermAtom } from '@/atoms';

export const showCurrentValidatorsAtom = atom<boolean>(true);
export const validatorDataAtom = atom<CombinedStakingInfo[]>([]);

export const filteredValidatorsAtom = atom(get => {
  const validatorData = get(validatorDataAtom);
  const showCurrentValidators = get(showCurrentValidatorsAtom);
  const validatorSortOrder = get(validatorSortOrderAtom);
  const validatorSortType = get(validatorSortTypeAtom);
  const searchTerm = get(searchTermAtom).toLowerCase();

  // Filter validators based on search term
  const filteredValidators = validatorData.filter(validator =>
    validator.validator.description.moniker.toLowerCase().includes(searchTerm),
  );

  // Determine which validators to show based on user preference (current or all)
  const validatorsToShow = showCurrentValidators
    ? filteredValidators.filter(item => parseFloat(item.balance.amount) > 0)
    : filteredValidators;

  // Sort the filtered validators
  return validatorsToShow.sort((a, b) => {
    let typeA, typeB;

    if (validatorSortType === 'name') {
      typeA = a.validator.description.moniker;
      typeB = b.validator.description.moniker;
    } else if (validatorSortType === 'delegation') {
      typeA = parseFloat(a.delegation.shares);
      typeB = parseFloat(b.delegation.shares);
    } else if (validatorSortType === 'rewards') {
      typeA = a.rewards.reduce((sum, reward) => sum + parseFloat(reward.amount), 0);
      typeB = b.rewards.reduce((sum, reward) => sum + parseFloat(reward.amount), 0);
    } else {
      typeA = 0;
      typeB = 0;
    }

    if (validatorSortOrder === 'Asc') {
      return typeA > typeB ? 1 : -1;
    } else {
      return typeA < typeB ? 1 : -1;
    }
  });
});
