import { lib, SHA512 } from 'crypto-js';
import { getLocalStorageItem, setLocalStorageItem } from './localStorage';

const PASSWORD_KEY = 'passwordHash';

export const getStoredPassword = (): { hash: string; salt: string } | null => {
  // TODO: enable burner accounts by enabling login through multiple passwords to different access tokens
  const storedHash = getLocalStorageItem(PASSWORD_KEY);
  return storedHash ? JSON.parse(storedHash) : null;
};

export const storePassword = (hash: string, salt: string): void => {
  const passwordHash = JSON.stringify({ hash, salt });
  setLocalStorageItem(PASSWORD_KEY, passwordHash);
};

export const hashPassword = (password: string, salt: string): string => {
  return SHA512(password + salt).toString();
};

export const storePasswordHash = (password: string): void => {
  const salt = lib.WordArray.random(16).toString();
  const passwordHash = hashPassword(password, salt);

  storePassword(passwordHash, salt);
};

export const getPasswordHash = (): { hash: string; salt: string } | null => {
  const storedHash = getStoredPassword();
  return storedHash;
};

export const verifyPassword = (inputPassword: string): boolean => {
  const storedHash = getPasswordHash();
  if (!storedHash) return false;

  const inputHash = hashPassword(inputPassword, storedHash.salt);
  const isValidPassword = inputHash === storedHash.hash;
  return isValidPassword;
};
