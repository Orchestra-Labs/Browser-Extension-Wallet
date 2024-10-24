import { Secp256k1HdWallet } from '@cosmjs/amino';
import { encryptMnemonic } from './crypto';
import { storePasswordHash } from './auth';
import { NETWORK, WALLET_PREFIX } from '@/constants';
import { storeAccessToken, storeMnemonic } from './localStorage';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { setupWalletSession } from './sessionStorage';

/**
 * Create a wallet using Secp256k1HdWallet and store encrypted mnemonic and password hash.
 * @param mnemonic The mnemonic string (12 or 24 words).
 * @param password The password for the wallet.
 * @param use24Words Whether to use 24-word mnemonic.
 * @returns An object containing the wallet address and network.
 */
export const createWallet = async (
  mnemonic: string,
  password: string,
): Promise<{ walletAddress: string; network: string }> => {
  try{
    // Create wallet from mnemonic
    const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: WALLET_PREFIX,
    });

    // Get wallet address
    const [{ address }] = await wallet.getAccounts();

    // Store hashed password in localStorage
    storePasswordHash(password);

    // Encrypt the mnemonic using the password and store it
    const encryptedMnemonic = encryptMnemonic(mnemonic, password);
    storeMnemonic(encryptedMnemonic);

    const sessionCreated = await setupWalletSession(address, mnemonic);
    if (!sessionCreated) {
      throw new Error('Failed to create wallet session');
    }

    // Return wallet information
    return {
      walletAddress: address,
      network: NETWORK,
    };
  } catch (error) {
    console.error('Error in wallet creation:', error);
    throw error;
  }
};

/**
 * Retrieves the wallet by decrypting the mnemonic with the provided password.
 * @param mnemonic The decrypted mnemonic to generate the wallet.
 * @returns The Secp256k1HdWallet instance
 */
export const getWallet = async (mnemonic: string): Promise<Secp256k1HdWallet> => {
  // Create the wallet using the decrypted mnemonic
  const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, { prefix: WALLET_PREFIX });

  return wallet;
};

export async function createOfflineSignerFromMnemonic(
  mnemonic: string,
): Promise<DirectSecp256k1HdWallet> {
  // You can specify the derivation path here if necessary
  const hdWallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: WALLET_PREFIX,
  });
  return hdWallet;
}

/**
 * Generate a token containing non-sensitive wallet information.
 * @param walletAddress The public wallet address.
 * @returns The generated token.
 */
export const generateToken = (walletAddress: string): string => {
  const token = JSON.stringify({
    walletAddress,
    network: NETWORK,
    timestamp: new Date().toISOString(),
  });

  storeAccessToken(token);
  return token;
};
