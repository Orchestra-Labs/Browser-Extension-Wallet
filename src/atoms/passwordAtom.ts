import { atom } from 'jotai';

export const passwordAtom = atom<string>('');
export const confirmPasswordAtom = atom<string>('');

export const passwordsVerifiedAtom = atom<boolean>(false);
