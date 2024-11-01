import { useEffect, useRef } from 'react';
import { isRefreshingAtom, walletStateAtom } from '@/atoms';
import { useAtom, useSetAtom } from 'jotai';
import { DATA_FRESHNESS_TIMEOUT } from '@/constants';

export const useUpdateWalletTimer = () => {
  const [walletState] = useAtom(walletStateAtom);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const setIsRefreshing = useSetAtom(isRefreshingAtom);

  const updateWalletAssets = () => {
    if (walletState.address) {
      console.log('Refreshing wallet assets on interval for', walletState);
      setIsRefreshing(true);
    }
  };

  const clearExistingTimer = () => {
    if (timerRef.current) {
      console.log('Clearing existing timer.');
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    clearExistingTimer();

    if (walletState.address) {
      console.log('Setting new timer to refresh wallet assets every', DATA_FRESHNESS_TIMEOUT, 'ms');
      timerRef.current = setInterval(updateWalletAssets, DATA_FRESHNESS_TIMEOUT);
    }
  };

  useEffect(() => {
    if (walletState.address !== '') {
      startTimer();
    }

    return () => {
      clearExistingTimer();
    };
  }, [walletState.address]);
};
