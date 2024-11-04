import { atom } from 'jotai';

export const isFetchingWalletDataAtom = atom(false);
export const isFetchingValidatorDataAtom = atom(false);
export const isFetchingDataAtom = atom(get => ({
  wallet: get(isFetchingWalletDataAtom),
  validator: get(isFetchingValidatorDataAtom),
}));
