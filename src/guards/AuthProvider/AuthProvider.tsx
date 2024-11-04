import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { getAddress, getSessionToken, userCanLogIn } from '@/helpers';
import { useAtomValue, useSetAtom } from 'jotai';
import { walletAddressAtom } from '@/atoms';
import { useRefreshData } from '@/hooks';
import { isLoggedInAtom } from '@/atoms/isLoggedInAtom';

interface AuthContextType {
  canLogIn: boolean;
  isLoggedIn: boolean;
  initializeWallet: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const canLogIn = userCanLogIn();
  const { refreshData } = useRefreshData();

  const isLoggedIn = useAtomValue(isLoggedInAtom);
  const setWalletAddress = useSetAtom(walletAddressAtom);

  const initializeWallet = async () => {
    const sessionToken = getSessionToken();
    if (!sessionToken?.mnemonic) return;

    try {
      const address = await getAddress(sessionToken.mnemonic);
      console.log('Wallet address set:', address);

      setWalletAddress(address);
      refreshData();
    } catch (error) {
      console.error('Error initializing wallet address:', error);
    }
  };

  useEffect(() => {
    console.log('AuthProvider useEffect triggered. isLoggedIn:', isLoggedIn);

    if (isLoggedIn) {
      initializeWallet();
    }
  }, [isLoggedIn]);

  return (
    <AuthContext.Provider value={{ canLogIn, isLoggedIn, initializeWallet }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
