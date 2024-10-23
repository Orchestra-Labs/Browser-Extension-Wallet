import { Asset, CombinedStakingInfo } from '@/types';
import { stripNonAlphanumerics } from './utils';

export function filterAndSortAssets(
  assets: Asset[],
  searchTerm: string,
  sortType: 'name' | 'amount',
  sortOrder: 'Asc' | 'Desc',
  showAllAssets: boolean = true,
): typeof assets {
  const lowercasedSearchTerm = searchTerm.toLowerCase();

  // Filter assets based on search term
  const filteredAssets = assets.filter(
    asset =>
      asset.denom.toLowerCase().includes(lowercasedSearchTerm) ||
      asset.symbol?.toLowerCase().includes(lowercasedSearchTerm),
  );

  // Filter for non-zero values if required
  const finalAssets = showAllAssets
    ? filteredAssets
    : filteredAssets.filter(asset => parseFloat(asset.amount) > 0);

  // Sort the assets based on type and order
  return finalAssets.sort((a, b) => {
    let valueA: string | number;
    let valueB: string | number;

    if (sortType === 'name') {
      valueA = stripNonAlphanumerics(a.symbol?.toLowerCase() || a.denom.toLowerCase());
      valueB = stripNonAlphanumerics(b.symbol?.toLowerCase() || b.denom.toLowerCase());

      return sortOrder === 'Asc'
        ? valueA.localeCompare(valueB, undefined, { sensitivity: 'base' })
        : valueB.localeCompare(valueA, undefined, { sensitivity: 'base' });
    } else {
      valueA = parseFloat(a.amount);
      valueB = parseFloat(b.amount);
    }

    if (sortOrder === 'Asc') {
      return valueA > valueB ? 1 : -1;
    } else {
      return valueA < valueB ? 1 : -1;
    }
  });
}

export function filterAndSortValidators(
  validators: CombinedStakingInfo[],
  searchTerm: string,
  sortType: 'name' | 'delegation' | 'rewards' | 'apr' | 'votingPower',
  sortOrder: 'Asc' | 'Desc',
  showCurrentValidators: boolean,
): typeof validators {
  const lowercasedSearchTerm = searchTerm.toLowerCase();

  // Filter validators based on search term
  const filteredValidators = validators.filter(validator =>
    validator.validator.description.moniker.toLowerCase().includes(lowercasedSearchTerm),
  );

  // Filter current validators based on user preference (current or all)
  const finalValidators = showCurrentValidators
    ? filteredValidators.filter(item => parseFloat(item.balance.amount) > 0)
    : filteredValidators;

  // Sort the validators
  return finalValidators.sort((a, b) => {
    let valueA, valueB;

    if (sortType === 'name') {
      valueA = stripNonAlphanumerics(a.validator.description.moniker.toLowerCase());
      valueB = stripNonAlphanumerics(b.validator.description.moniker.toLowerCase());

      return sortOrder === 'Asc'
        ? valueA.localeCompare(valueB, undefined, { sensitivity: 'base' })
        : valueB.localeCompare(valueA, undefined, { sensitivity: 'base' });
    } else if (sortType === 'delegation') {
      valueA = parseFloat(a.delegation.shares);
      valueB = parseFloat(b.delegation.shares);
    } else if (sortType === 'rewards') {
      valueA = a.rewards.reduce((sum, reward) => sum + parseFloat(reward.amount), 0);
      valueB = b.rewards.reduce((sum, reward) => sum + parseFloat(reward.amount), 0);
    }

    return sortOrder === 'Asc' ? (valueA > valueB ? 1 : -1) : valueA < valueB ? 1 : -1;
  });
}
