import { TOKEN_EXPIRATION_TIME, WALLET_PREFIX } from '@/constants';
import { SessionToken } from '@/types';
import { removeLocalStorageItem, setLocalStorageItem } from './localStorage';
import { Secp256k1HdWallet } from '@cosmjs/amino';

const SESSION_KEY = 'sessionToken';

export const userIsLoggedIn = () => {
  const token = getSessionToken();
  return token;
};

export const saveSessionToken = (sessionToken: SessionToken): void => {
  const sessionTokenJSON = JSON.stringify(sessionToken);
  setLocalStorageItem(SESSION_KEY, sessionTokenJSON);
  console.log('Session token saved to localStorage');
};

export const getSessionToken = (): SessionToken | null => {
  try {
    const tokenString = localStorage.getItem(SESSION_KEY);
    if (!tokenString) {
      return null;
    }

    const token = JSON.parse(tokenString);

    // Validate token structure
    if (!token || !token.mnemonic || !token.address) {
      console.error('Invalid token structure:', token);
      return null;
    }

    return token;
  } catch (error) {
    console.error('Error retrieving session token:', error);
    return null;
  }
};

export const removeSessionToken = (): void => {
  removeLocalStorageItem(SESSION_KEY);
  console.log('Session token removed');
};

export const isTokenValid = (): boolean => {
  const tokenData = getSessionToken();
  if (!tokenData) return false;

  const sessionStartTime = new Date(tokenData.timestamp).getTime();
  const currentTime = Date.now();

  const isExpired = currentTime - sessionStartTime >= TOKEN_EXPIRATION_TIME;
  return !isExpired;
};

// TODO: save full wallet information or just address depending on auth vs UX level selected.  only need 1 function to handle both cases
// TODO: move to auth or call from auth
export const saveSessionAuthToken = async (
  wallet: Secp256k1HdWallet,
  persist: boolean = false,
): Promise<SessionToken> => {
  const [{ address }] = await wallet.getAccounts();
  const sessionStartTime = new Date().toISOString();

  const sessionToken = {
    mnemonic: wallet.mnemonic,
    address,
    network: WALLET_PREFIX,
    rememberMe: persist,
    timestamp: sessionStartTime,
  };
  saveSessionToken(sessionToken);

  return sessionToken;
};
