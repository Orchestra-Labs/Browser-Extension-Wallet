import { decryptMnemonic, getStoredMnemonic } from './crypto';
import { clearLocalStorage } from './localStorage';
import { getPasswordHash, verifyPassword } from './password';
import { saveSessionAuthToken } from './session';
import { getWallet } from './wallet';

export const userCanLogIn = () => {
  const password = getPasswordHash();
  const mnemonic = getStoredMnemonic();

  const canLogIn = password && mnemonic;
  return canLogIn;
};

export const clearStoredData = (): void => {
  clearLocalStorage();
};

export const tryAuthorizeWalletAccess = async (
  password: string,
): Promise<'success' | 'no_wallet' | 'error'> => {
  const encryptedMnemonic = getStoredMnemonic();
  if (!encryptedMnemonic) {
    console.log('No wallet found');
    return 'no_wallet';
  }

  const isVerified = verifyPassword(password);
  if (!isVerified) {
    return 'error';
  }

  try {
    const mnemonic = decryptMnemonic(encryptedMnemonic, password);
    if (!mnemonic) {
      return 'error';
    }

    const wallet = await getWallet(mnemonic);
    saveSessionAuthToken(wallet);

    return 'success';
  } catch (error) {
    console.error('Authorization failed:', error);
    return 'error';
  }
};
