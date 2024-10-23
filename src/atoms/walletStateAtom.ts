import { atom } from 'jotai';
import { WalletAssets } from '@/types';
import {
  searchTermAtom,
  assetSortOrderAtom,
  assetSortTypeAtom,
  showAllAssetsAtom,
  dialogSearchTermAtom,
  assetDialogSortOrderAtom,
  assetDialogSortTypeAtom,
} from '@/atoms';
import { filterAndSortAssets } from '@/helpers';

export const walletStateAtom = atom<WalletAssets>({
  address: '',
  assets: [],
});

export const filteredAssetsAtom = atom(get => {
  const walletState = get(walletStateAtom);
  const searchTerm = get(searchTermAtom);
  const sortOrder = get(assetSortOrderAtom);
  const sortType = get(assetSortTypeAtom);
  const showAllAssets = get(showAllAssetsAtom);

  return filterAndSortAssets(walletState.assets, searchTerm, sortType, sortOrder, showAllAssets);
});

export const filteredDialogAssetsAtom = atom(get => {
  const walletState = get(walletStateAtom);
  const searchTerm = get(dialogSearchTermAtom);
  const sortOrder = get(assetDialogSortOrderAtom);
  const sortType = get(assetDialogSortTypeAtom);

  return filterAndSortAssets(walletState.assets, searchTerm, sortType, sortOrder);
});
