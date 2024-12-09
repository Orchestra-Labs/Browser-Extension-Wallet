import { ChainRecord } from '@/types';

const CHAINS_KEY = 'chainsToken';

export const setChains = (chains: ChainRecord[]): void => {
  localStorage.setItem(CHAINS_KEY, JSON.stringify(chains));
};

export const getChains = (): ChainRecord[] => {
  const storedChains = localStorage.getItem(CHAINS_KEY);
  return storedChains ? JSON.parse(storedChains) : [];
};

export const removeChain = (chainId: string): void => {
  const chains = getChains();
  const updatedChains = chains.filter(chain => chain.chainId !== chainId);
  localStorage.setItem(CHAINS_KEY, JSON.stringify(updatedChains));
};

export const clearChains = (): void => {
  localStorage.removeItem(CHAINS_KEY);
};
