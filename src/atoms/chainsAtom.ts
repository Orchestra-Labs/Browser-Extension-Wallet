import { atom } from 'jotai';
import { dialogSearchTermAtom, assetDialogSortOrderAtom, assetDialogSortTypeAtom } from '@/atoms';
import { filterAndSortAssets } from '@/helpers';
import { Asset } from '@/types';

export const chainsAtom = atom<Asset[]>([]);

// Create a filtered version for the dialog
export const filteredChainsAtom = atom(get => {
  const exchangeAssets = get(exchangeAssetsAtom);
  const searchTerm = get(dialogSearchTermAtom);
  const sortOrder = get(assetDialogSortOrderAtom);
  const sortType = get(assetDialogSortTypeAtom);

  const nonIbcAssets = exchangeAssets.filter(asset => !asset.isIbc);

  return filterAndSortAssets(nonIbcAssets, searchTerm, sortType, sortOrder);
});
