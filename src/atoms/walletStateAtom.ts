import { atom } from 'jotai';
import { WalletAssets } from '@/types';

export const walletStateAtom = atom<WalletAssets>({
  address: '',
  assets: [],
});
