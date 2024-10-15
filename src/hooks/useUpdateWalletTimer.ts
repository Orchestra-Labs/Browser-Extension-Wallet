import { useEffect, useRef } from 'react';
import { fetchWalletAssets } from '@/helpers';
import { walletStateAtom } from '@/atoms';
import { useAtom } from 'jotai';
import { DATA_FRESHNESS_TIMEOUT } from '@/constants';

export const useUpdateWalletTimer = () => {
  const [walletState, setWalletState] = useAtom(walletStateAtom);
  const timerRef = useRef<NodeJS.Timeout | null>(null); // Using a ref to hold the timer

  const updateWalletAssets = () => {
    if (walletState.address) {
      console.log('Fetching wallet assets on interval for', walletState);
      fetchWalletAssets(walletState)
        .then(assets => {
          console.log('Assets fetched on interval:', assets);
          setWalletState(prevState => ({
            ...prevState,
            assets,
          }));
        })
        .catch(error => {
          console.error('Error refetching wallet assets:', error);
        });
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
    clearExistingTimer(); // Ensure no existing timer is running

    if (walletState.address) {
      console.log('Setting new timer to refetch wallet assets every', DATA_FRESHNESS_TIMEOUT, 'ms');
      timerRef.current = setInterval(updateWalletAssets, DATA_FRESHNESS_TIMEOUT);
    }
  };

  useEffect(() => {
    if (walletState.address !== '') {
      startTimer(); // Start the timer only if a wallet address exists
    }

    return () => {
      clearExistingTimer(); // Clean up the timer on component unmount or address change
    };
  }, [walletState.address]);
};
