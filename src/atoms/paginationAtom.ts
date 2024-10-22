import { Pagination } from '@/types';
import { atom } from 'jotai';

export const paginationAtom = atom<Pagination | null>(null);
