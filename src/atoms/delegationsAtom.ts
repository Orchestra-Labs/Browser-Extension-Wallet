import { DelegationResponse, Pagination } from '@/types';
import { atom } from 'jotai';

export const delegationAtom = atom<DelegationResponse[]>([]);

export const paginationAtom = atom<Pagination | null>(null);
