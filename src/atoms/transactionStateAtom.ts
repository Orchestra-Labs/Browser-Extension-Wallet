import { defaultReceiveState, defaultSendState } from '@/constants';
import { TransactionState } from '@/types';
import { atom } from 'jotai';

export const sendStateAtom = atom<TransactionState>(defaultSendState);
export const receiveStateAtom = atom<TransactionState>(defaultReceiveState);
