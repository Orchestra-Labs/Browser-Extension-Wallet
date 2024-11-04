import React, { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { getAddress, getSessionToken, userCanLogIn, userIsLoggedIn } from '@/helpers';
import { useInactivityCheck, useUpdateWalletTimer, useWalletAssetsRefresh } from '@/hooks';
import { shouldRefreshDataAtom, walletStateAtom } from '@/atoms';
import { useAtom, useSetAtom } from 'jotai';
import { ROUTES } from '@/constants';
import { loadingInitialDataAtom } from '@/atoms/loadingAtom';

interface AuthGuardProps {
  children?: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  console.log('Initializing AuthGuard');

  const canLogIn = userCanLogIn();
  console.log('Checking if the user can log in:', canLogIn);

  if (!canLogIn) {
    console.log("Can't log in, navigating to new wallet page");
    return <Navigate to={ROUTES.AUTH.NEW_WALLET.ROOT} />;
  }

  const isLoggedIn = userIsLoggedIn();
  console.log('Checking if the user is logged in:', isLoggedIn);

  if (!isLoggedIn) {
    console.log('Not logged in, navigating to login page');
    return <Navigate to={ROUTES.AUTH.ROOT} />;
  }

  const { pathname } = useLocation();
  const { refreshWalletAssets } = useWalletAssetsRefresh();

  const [walletState, setWalletState] = useAtom(walletStateAtom);
  const setShouldRefreshData = useSetAtom(shouldRefreshDataAtom);
  const setIsLoading = useSetAtom(loadingInitialDataAtom);

  const [requestedLocation, setRequestedLocation] = useState<string | null>(null);

  const walletInfoNotInState = walletState.address === '';
  console.log('Current wallet state:', walletState);
  console.log('Wallet info not in state:', walletInfoNotInState);

  useInactivityCheck();
  useUpdateWalletTimer();

  const setTokenToState = async () => {
    if (walletInfoNotInState) {
      setIsLoading(true);
      console.log('Fetching wallet address from token...');

      const sessionToken = getSessionToken();
      console.log('Session token retrieved:', sessionToken);

      if (!sessionToken?.mnemonic) {
        console.log('No mnemonic found in session token');
        return;
      }

      try {
        const address = await getAddress(sessionToken.mnemonic);
        console.log('Wallet address derived from token mnemonic:', address);

        if (address) {
          console.log('Setting wallet address and assets in state:', address);
          setWalletState({
            address: address,
            assets: [],
          });
          setShouldRefreshData(true);
        }
      } catch (error) {
        console.error('Error retrieving wallet address:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (walletInfoNotInState) {
      console.log('Wallet info missing in state; setting token to state');
      setTokenToState();
    } else {
      console.log('Refreshing wallet assets');
      refreshWalletAssets();
      setIsLoading(false);
    }
  }, [walletState.address]);

  useEffect(() => {
    console.log('Popup is opened (component mounted).');

    const handleBlur = () => {
      console.log('Browser extension lost focus (blur event)');
    };

    const handleFocus = () => {
      // TODO: check timeout, pull from local storage (session storage will not exist)
      console.log('Browser extension gained focus (focus event)');
    };

    // TODO: after blur, clear session token after timeout
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      // TODO: save any necessary items to local storage
      console.log('Popup is closed (component unmounted).');
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  if (walletInfoNotInState) {
    console.log('No token found, redirecting to login.');
    if (pathname !== requestedLocation) {
      console.log('Setting requested location as pathname:', pathname);
      setRequestedLocation(pathname);
    }
    return <Navigate to={ROUTES.AUTH.ROOT} />;
  }

  if (requestedLocation && pathname !== requestedLocation) {
    console.log('Redirecting to previously requested location:', requestedLocation);
    const redirectLocation = requestedLocation;
    setRequestedLocation(null);
    return <Navigate to={redirectLocation} />;
  }

  console.log('AuthGuard returning child components');
  return <>{children}</>;
};
