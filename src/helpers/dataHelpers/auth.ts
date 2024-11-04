import { getAccounts } from './account';
import { decryptMnemonic, getStoredMnemonic } from './crypto';
import { clearLocalStorage } from './localStorage';
import { getPasswordHash, getPasswordRecords } from './password';
import { saveSessionData } from './session';
import { getWallet } from './wallet';

export const userCanLogIn = () => {
  console.log('Checking if user can log in...');

  const passwordRecords = getPasswordRecords();
  console.log('Password records retrieved:', passwordRecords);

  const accounts = getAccounts();
  console.log('Stored accounts:', accounts);

  const canLogIn = passwordRecords.some(passwordRecord =>
    accounts.some(account => account.id === passwordRecord.id),
  );

  console.log('Can log in:', canLogIn);
  return canLogIn;
};

export const clearStoredData = (): void => {
  console.log('Clearing all stored data from local storage...');
  clearLocalStorage();
};

export const tryAuthorizeAccess = async (
  password: string,
  persist: boolean = false,
): Promise<'success' | 'no_wallet' | 'error'> => {
  console.log('Attempting to authorize access...');

  const encryptedMnemonic = getStoredMnemonic();
  if (!encryptedMnemonic) {
    console.log('No wallet found in local storage.');
    return 'no_wallet';
  }
  console.log('Encrypted mnemonic found:', encryptedMnemonic);

  const passwordHash = getPasswordHash(password);
  console.log('Password hash found:', passwordHash);

  if (!passwordHash) {
    console.log('Password hash does not match. Authorization failed.');
    return 'error';
  }

  try {
    console.log('Decrypting mnemonic...');
    const mnemonic = decryptMnemonic(encryptedMnemonic, password);
    console.log('Decrypted mnemonic:', mnemonic);

    if (!mnemonic) {
      console.log('Decryption failed. Incorrect password or corrupted mnemonic.');
      return 'error';
    }

    console.log('Retrieving wallet using decrypted mnemonic...');
    const wallet = await getWallet(mnemonic);
    console.log('Wallet retrieved:', wallet);

    console.log('Saving session data...');
    await saveSessionData(wallet, passwordHash, persist);

    console.log('Authorization successful');
    return 'success';
  } catch (error) {
    console.error('Authorization failed with error:', error);
    return 'error';
  }
};
