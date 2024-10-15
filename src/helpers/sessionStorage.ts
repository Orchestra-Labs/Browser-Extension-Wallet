import { Secp256k1HdWallet } from '@cosmjs/amino';
import { getWallet } from './wallet';

let sessionWallet: Secp256k1HdWallet | null = null;
let sessionExpiryTimeout: NodeJS.Timeout | null = null;

const SESSION_TIMEOUT_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Store wallet in sessionStorage by serializing it.
 * Since Secp256k1HdWallet isn't serializable directly, we'll store mnemonic and recreate the wallet.
 * @param mnemonic - The mnemonic used to recreate the wallet.
 */
const storeWalletInSession = (mnemonic: string): void => {
  console.log('Storing wallet mnemonic in sessionStorage:', mnemonic);
  sessionStorage.setItem('walletMnemonic', mnemonic);
};

/**
 * Retrieve wallet from sessionStorage.
 * This recreates the wallet using the stored mnemonic.
 * @returns {Promise<Secp256k1HdWallet | null>} The wallet or null if not found.
 */
const retrieveWalletFromSession = async (): Promise<Secp256k1HdWallet | null> => {
  const storedMnemonic = sessionStorage.getItem('walletMnemonic');
  if (storedMnemonic) {
    console.log('Wallet mnemonic found in sessionStorage, recreating wallet');
    return Secp256k1HdWallet.fromMnemonic(storedMnemonic, { prefix: 'symphony' });
  }
  console.log('No wallet mnemonic found in sessionStorage');
  return null;
};

/**
 * Unlock the wallet, store it in memory and sessionStorage, and set up the session timeout.
 */
export const unlockWalletSession = async (mnemonic: string): Promise<boolean> => {
  console.log('Unlocking wallet session with mnemonic:', mnemonic);
  const wallet = await getWallet(mnemonic); // Get wallet from mnemonic

  if (wallet) {
    sessionWallet = wallet;

    // Save wallet mnemonic in sessionStorage
    storeWalletInSession(mnemonic);

    // Set up the session timeout to automatically lock the wallet after inactivity
    setSessionTimeout();
    console.log('Wallet session unlocked and stored');
    return true;
  }
  console.error('Failed to unlock wallet session');
  return false;
};

/**
 * Restore wallet from sessionStorage.
 */
export const restoreWalletSession = async (): Promise<Secp256k1HdWallet | null> => {
  console.log('Attempting to restore wallet session from sessionStorage');
  const wallet = await retrieveWalletFromSession();
  if (wallet) {
    sessionWallet = wallet;
    setSessionTimeout(); // Refresh session timeout
    console.log('Wallet session restored from sessionStorage');
    return sessionWallet;
  }
  console.error('Failed to restore wallet session from sessionStorage');
  return null;
};

/**
 * Set a timeout to automatically lock the wallet after the session duration.
 */
const setSessionTimeout = () => {
  console.log('Setting session timeout for', SESSION_TIMEOUT_DURATION, 'milliseconds');

  // Clear any existing session timeout
  if (sessionExpiryTimeout) {
    clearTimeout(sessionExpiryTimeout);
  }

  // Set a new timeout to lock the wallet after the session timeout duration
  sessionExpiryTimeout = setTimeout(() => {
    console.log('Session expired, locking wallet');
    lockWalletSession();
  }, SESSION_TIMEOUT_DURATION);
};

/**
 * Lock the wallet and clear the session.
 */
export const lockWalletSession = () => {
  console.log('Locking wallet session and clearing sessionStorage');
  sessionWallet = null;

  // Remove wallet from sessionStorage
  sessionStorage.removeItem('walletMnemonic');

  if (sessionExpiryTimeout) {
    clearTimeout(sessionExpiryTimeout);
  }
};

/**
 * Get the current session wallet. If the wallet is locked (null), it returns null.
 */
export const getSessionWallet = async (): Promise<Secp256k1HdWallet | null> => {
  // TODO: session token gets cleared on loss of focus.
  console.log('Attempting to retrieve session wallet from memory');

  const authToken = sessionStorage.getItem('sessionToken');
  const sessionInfo = JSON.parse(authToken || '');
  const wallet = await getWallet(sessionInfo.mnemonic);

  // Reset the session timeout on each access to extend the session
  if (wallet) {
    console.log('Session wallet found in memory');
    setSessionTimeout();
    return wallet;
  }

  // If wallet not in memory, attempt to restore from session storage
  console.log('Session wallet not found in memory, attempting to restore from sessionStorage');
  return await restoreWalletSession();
};
