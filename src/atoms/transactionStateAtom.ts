import { Asset } from '@/types';
import { atom } from 'jotai';

// Atom for the send state
export const sendStateAtom = atom({
  asset: null as Asset | null,
  amount: 0,
});

// Atom for the receive state
export const receiveStateAtom = atom({
  asset: null as Asset | null,
  amount: 0,
});
