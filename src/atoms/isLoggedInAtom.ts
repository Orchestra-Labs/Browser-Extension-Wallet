import { userIsLoggedIn } from '@/helpers';
import { atom } from 'jotai';

export const isLoggedInAtom = atom<boolean>(userIsLoggedIn());
