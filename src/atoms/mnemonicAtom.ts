import { atom } from 'jotai';

export const mnemonic12State = atom<string[]>(new Array(12).fill(''));
export const mnemonic24State = atom<string[]>(new Array(24).fill(''));

export const use24WordsState = atom<boolean>(false);

export const mnemonicVerifiedState = atom<boolean>(false);
