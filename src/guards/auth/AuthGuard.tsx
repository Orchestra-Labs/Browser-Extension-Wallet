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
  const [isLoading, setIsLoading] = useState(true); // Control loading state to prevent unnecessary rendering

  console.log('Current wallet state:', walletState);

  useInactivityCheck(); // Handle user inactivity
  useUpdateWalletTimer(); // Handle token timer updates

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
        setIsLoading(true); // Set loading while fetching

        // Fetch wallet assets and update the state
        fetchWalletAssets({ address: walletAddress, assets: [] })
          .then(assets => {
            console.log('Fetched wallet assets:', assets);
            setWalletState({
              address: walletAddress,
              assets,
            });
            setIsLoading(false); // Done loading
          })
          .catch(error => {
            console.error('Error fetching wallet assets:', error);
            setWalletState(prevState => ({
              ...prevState,
              address: walletAddress,
              assets: [],
            }));
            setIsLoading(false); // Done loading even in case of error
          });
      } else {
        setIsLoading(false); // If no wallet address is found, stop loading
      }
    }
  };

  useEffect(() => {
    if (walletInfoNotInState) {
      setTokenToState();
    } else {
      setIsLoading(false); // If wallet already exists, no need to fetch again
    }
  }, [walletState.address]); // Run only when wallet address is updated

  // Prevent redirect or rendering while loading
  if (isLoading) {
    // TODO: change with scroll wheel or similar
    return <div>Loading...</div>; // Placeholder or spinner can be added here
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
