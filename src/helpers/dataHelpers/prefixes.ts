import { ONE_DAY } from '@/constants';
import { getLocalStorageItem, setLocalStorageItem } from './localStorage';
import { ChainData, PrefixStorage } from '@/types';

const PREFIXES_STORAGE_KEY = 'bech32Prefixes';

export const getPrefixesFromLocalStorage = (): PrefixStorage | null => {
  const storedData = getLocalStorageItem(PREFIXES_STORAGE_KEY);

  if (storedData) {
    try {
      return JSON.parse(storedData) as PrefixStorage;
    } catch (error) {
      console.error('Failed to parse prefixes from localStorage:', error);
    }
  }

  return null;
};

export const savePrefixesToLocalStorage = (data: ChainData[]): void => {
  const prefixStorage: PrefixStorage = {
    lastUpdated: new Date().toISOString(),
    data,
  };

  setLocalStorageItem(PREFIXES_STORAGE_KEY, JSON.stringify(prefixStorage));
};

export const prefixesNeedRefresh = (prefixStorage: PrefixStorage | null): boolean => {
  if (!prefixStorage) return true;

  const lastUpdatedTime = new Date(prefixStorage.lastUpdated).getTime();
  const currentTime = new Date().getTime();

  return currentTime - lastUpdatedTime >= ONE_DAY;
};
