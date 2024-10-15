import CryptoJS from 'crypto-js';

/**
 * Encrypt a given mnemonic using AES encryption.
 * @param mnemonic The mnemonic string.
 * @param password The password to encrypt with.
 * @returns The encrypted mnemonic.
 */
export const encryptMnemonic = (mnemonic: string, password: string): string => {
  return CryptoJS.AES.encrypt(mnemonic, password).toString();
};

/**
 * Decrypt the encrypted mnemonic using AES decryption.
 * @param encryptedMnemonic The encrypted mnemonic string.
 * @param password The password used for encryption.
 * @returns The decrypted mnemonic.
 */
export const decryptMnemonic = (encryptedMnemonic: string, password: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedMnemonic, password);
  return bytes.toString(CryptoJS.enc.Utf8);
};
