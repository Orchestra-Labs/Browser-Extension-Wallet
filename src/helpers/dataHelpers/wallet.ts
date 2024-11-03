import { Secp256k1HdWallet } from '@cosmjs/amino';
import { encryptMnemonic, storeMnemonic } from './crypto';
import { WALLET_PREFIX } from '@/constants';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { storePasswordHash } from './password';
import { saveSessionAuthToken } from './session';

export const createWallet = async (
  mnemonic: string,
  password: string,
): Promise<Secp256k1HdWallet> => {
  try {
    const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: WALLET_PREFIX,
    });

    storePasswordHash(password);

    const encryptedMnemonic = encryptMnemonic(mnemonic, password);
    storeMnemonic(encryptedMnemonic);

    const sessionCreated = await saveSessionAuthToken(wallet);
    if (!sessionCreated) {
      throw new Error('Failed to create wallet session');
    }

    return wallet;
  } catch (error) {
    console.error('Error in wallet creation:', error);
    throw error;
  }
};

export const getWallet = async (mnemonic: string): Promise<Secp256k1HdWallet> => {
  const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, { prefix: WALLET_PREFIX });

  return wallet;
};

export async function createOfflineSignerFromMnemonic(
  mnemonic: string,
): Promise<DirectSecp256k1HdWallet> {
  const hdWallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
    prefix: WALLET_PREFIX,
  });
  return hdWallet;
}

// TODO: make function to add wallet to account
