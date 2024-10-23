import { DEFAULT_ASSET } from '@/constants';
import { atom } from 'jotai';

// Atom for the send state
export const sendStateAtom = atom({
  asset: DEFAULT_ASSET,
  amount: 0,
});

// Atom for the receive state
export const receiveStateAtom = atom({
  asset: DEFAULT_ASSET,
  amount: 0,
});
