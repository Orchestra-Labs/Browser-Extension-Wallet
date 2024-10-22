import { atom } from 'jotai';
import { WalletAssets } from '@/types';
import { searchTermAtom, assetSortOrderAtom, assetSortTypeAtom, showAllAssetsAtom } from '@/atoms';

export const walletStateAtom = atom<WalletAssets>({
  address: '',
  assets: [],
});

export const filteredAssetsAtom = atom(get => {
  const walletState = get(walletStateAtom);
  const searchTerm = get(searchTermAtom).toLowerCase();
  const assetSortOrder = get(assetSortOrderAtom);
  const assetSortType = get(assetSortTypeAtom);
  const showAllAssets = get(showAllAssetsAtom);

  // Filter assets based on search term
  const filteredAssets = walletState.assets.filter(asset => {
    const matchesSearchTerm =
      asset.denom.toLowerCase().includes(searchTerm) ||
      asset.symbol?.toLowerCase().includes(searchTerm);

    // Check if we are showing all assets or only non-zero assets
    if (showAllAssets) {
      return matchesSearchTerm;
    }
    return parseFloat(asset.amount) > 0 && matchesSearchTerm;
  });

  // Sort assets based on selected sort type and order
  return filteredAssets.sort((a, b) => {
    const typeA = assetSortType === 'name' ? a.denom : parseFloat(a.amount);
    const typeB = assetSortType === 'name' ? b.denom : parseFloat(b.amount);

    if (assetSortOrder === 'Asc') {
      return typeA > typeB ? 1 : -1;
    } else {
      return typeA < typeB ? 1 : -1;
    }
  });
});
