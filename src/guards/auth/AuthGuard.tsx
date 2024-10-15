import React, { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { fetchWalletAssets, getStoredAccessToken } from '@/helpers';
import { useInactivityCheck, useUpdateWalletTimer } from '@/hooks';
import { walletStateAtom } from '@/atoms';
import { useAtom } from 'jotai';
import { ROUTES } from '@/constants';

interface AuthGuardProps {
  children?: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  console.log('auth guard');
  const { pathname } = useLocation();
  const [walletState, setWalletState] = useAtom(walletStateAtom);
  const [requestedLocation, setRequestedLocation] = useState<string | null>(null);
  const walletInfoNotInState = walletState.address === '';
  const [isLoading, setIsLoading] = useState(true);

  console.log('Current wallet state:', walletState);

  useInactivityCheck();
  useUpdateWalletTimer();

  const setTokenToState = () => {
    if (walletInfoNotInState) {
      console.log('Fetching wallet address from token...');
      const accessToken = getStoredAccessToken();
      const walletAddress = accessToken?.walletAddress;

      console.log('Access token:', accessToken);
      console.log('Wallet address from token:', walletAddress);

      if (walletAddress && walletState.address === '') {
        // Set wallet address in the global state (atom)
        console.log('Setting wallet address and assets in state:', walletAddress);
        setIsLoading(true);

        // Fetch wallet assets and update the state
        fetchWalletAssets({ address: walletAddress, assets: [] })
          .then(assets => {
            console.log('Fetched wallet assets:', assets);
            setWalletState({
              address: walletAddress,
              assets,
            });
            setIsLoading(false);
          })
          .catch(error => {
            console.error('Error fetching wallet assets:', error);
            setWalletState(prevState => ({
              ...prevState,
              address: walletAddress,
              assets: [],
            }));
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (walletInfoNotInState) {
      setTokenToState();
    } else {
      setIsLoading(false);
    }
  }, [walletState.address]);

  // Prevent redirect or rendering while loading
  if (isLoading) {
    // TODO: change with centered scroll wheel or similar
    return <div>Loading...</div>;
  }

  // If no wallet address is found, redirect to login
  if (walletInfoNotInState) {
    console.log('No token found, redirecting to login.');
    if (pathname !== requestedLocation) {
      console.log('pathname:', pathname);
      setRequestedLocation(pathname);
    }
    return <Navigate to={ROUTES.AUTH.ROOT} />;
  }

  // If requestedLocation is set, redirect to it
  if (requestedLocation && pathname !== requestedLocation) {
    const redirectLocation = requestedLocation;
    console.log('Redirecting to requested location:', redirectLocation);
    setRequestedLocation(null);
    return <Navigate to={redirectLocation} />;
  }

  console.log('returning child components');
  return <>{children}</>;
};
