import { atom } from 'jotai';

export type ErrorType = 'validation' | 'transaction' | 'network' | null;

export interface ErrorState {
  type: ErrorType;
  message: string;
  details?: string;
}

export const errorAtom = atom<ErrorState>({ type: null, message: '' });
export const errorDialogAtom = atom<boolean>(false);