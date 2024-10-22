import { atom } from 'jotai';

export const searchTermAtom = atom<string>('');

export const assetSortOrderAtom = atom<'Asc' | 'Desc'>('Desc');
export const assetSortTypeAtom = atom<'name' | 'amount'>('name');
export const validatorSortOrderAtom = atom<'Asc' | 'Desc'>('Desc');
export const validatorSortTypeAtom = atom<
  'name' | 'delegation' | 'rewards' | 'apr' | 'votingPower'
>('name');
