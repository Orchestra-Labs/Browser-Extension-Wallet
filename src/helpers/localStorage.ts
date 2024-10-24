import { SessionToken } from '@/types';

// General localStorage utility functions
const setLocalStorageItem = (key: string, value: string): void => {
  localStorage.setItem(key, value);
};

const getLocalStorageItem = (key: string): string | null => {
  return localStorage.getItem(key);
};

const removeLocalStorageItem = (key: string): void => {
  localStorage.removeItem(key);
};

const clearLocalStorage = (): void => {
  localStorage.clear();
};

// TODO: move all the following to their respective files
// Tailored functions utilizing the general functions

/**
 * Get the access token from localStorage.
 * @returns { { walletAddress: string, network: string, timestamp: string } | null}
 * The access token or null if not found.
 */
export const getStoredAccessToken = (): {
  walletAddress: string;
  network: string;
  timestamp: string;
} | null => {
  const token = getLocalStorageItem('accessToken');
  return token ? JSON.parse(token) : null;
};

/**
 * Save the access token to localStorage.
 * @param {string} token The access token to be saved.
 */
export const storeAccessToken = (token: string): void => {
  // TODO: enable burner accounts by enabling login through multiple passwords to different access tokens
  setLocalStorageItem('accessToken', token);
};

/**
 * Get the password hash object from localStorage.
 * @returns { { hash: string, salt: string } | null } The hashed password and salt or null if not found.
 */
export const getStoredPassword = (): { hash: string; salt: string } | null => {
  // TODO: enable burner accounts by enabling login through multiple passwords to different access tokens
  const storedHash = getLocalStorageItem('passwordHash');
  return storedHash ? JSON.parse(storedHash) : null;
};

/**
 * Save the password hash object to localStorage.
 * @param {string} hash The password hash.
 * @param {string} salt The salt used for hashing.
 */
export const storePassword = (hash: string, salt: string): void => {
  const passwordHash = JSON.stringify({ hash, salt });
  setLocalStorageItem('passwordHash', passwordHash);
};

/**
 * Get the encrypted mnemonic from localStorage.
 * @returns {string | null} The encrypted mnemonic or null if not found.
 */
export const getStoredMnemonic = (): string | null => {
  return getLocalStorageItem('encryptedMnemonic');
};

/**
 * Save the encrypted mnemonic to localStorage.
 * @param {string} encryptedMnemonic The encrypted mnemonic to be saved.
 */
export const storeMnemonic = (encryptedMnemonic: string): void => {
  setLocalStorageItem('encryptedMnemonic', encryptedMnemonic);
};

/**
 * Remove the access token from localStorage.
 */
export const removeStoredAccessToken = (): void => {
  removeLocalStorageItem('accessToken');
};

export const saveSessionToken = (sessionToken: SessionToken): void => {
  const sessionTokenJSON = JSON.stringify(sessionToken);
  setLocalStorageItem('sessionToken', sessionTokenJSON);
  console.log('Session token saved to localStorage');
};

export const getSessionToken = (): SessionToken | null => {
  try {
    const tokenString = localStorage.getItem('sessionToken');
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
  removeLocalStorageItem('sessionToken');
  console.log('Session token removed');
};

/**
 * Clear all wallet-related data from localStorage.
 */
export const clearStoredData = (): void => {
  clearLocalStorage();
};

const ERROR_COUNTS_KEY = 'nodeErrorCounts';

// Retrieve error counts from localStorage
export const getNodeErrorCounts = (): Record<string, number> => {
  const errorCounts = localStorage.getItem(ERROR_COUNTS_KEY);
  return errorCounts ? JSON.parse(errorCounts) : {};
};

// Store error counts in localStorage
export const storeNodeErrorCounts = (errorCounts: Record<string, number>): void => {
  localStorage.setItem(ERROR_COUNTS_KEY, JSON.stringify(errorCounts));
};

// Reset error counts (e.g., on login)
export const resetNodeErrorCounts = (): void => {
  localStorage.removeItem(ERROR_COUNTS_KEY);
};
