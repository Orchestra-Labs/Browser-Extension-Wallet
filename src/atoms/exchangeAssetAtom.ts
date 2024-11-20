import { atom } from 'jotai';
import { dialogSearchTermAtom, assetDialogSortOrderAtom, assetDialogSortTypeAtom } from '@/atoms';
import { filterAndSortAssets } from '@/helpers';
import { Asset } from '@/types';

export const exchangeAssetsAtom = atom<Asset[]>([]);

// Create a filtered version for the dialog
export const filteredExchangeAssetsAtom = atom(get => {
  const exchangeAssets = get(exchangeAssetsAtom);
  const searchTerm = get(dialogSearchTermAtom);
  const sortOrder = get(assetDialogSortOrderAtom);
  const sortType = get(assetDialogSortTypeAtom);

  const nonIbcAssets = exchangeAssets.filter(asset => !asset.isIbc);

  return filterAndSortAssets(nonIbcAssets, searchTerm, sortType, sortOrder);
});
