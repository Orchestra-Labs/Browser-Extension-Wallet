import {
  CHAIN_NODES,
  DELAY_BETWEEN_NODE_ATTEMPTS,
  LOCAL_ASSET_REGISTRY,
  MAX_NODES_PER_QUERY,
} from '@/constants';
import { SigningStargateClient, GasPrice } from '@cosmjs/stargate';
import { createOfflineSignerFromMnemonic, getAddress } from './dataHelpers/wallet';
import { delay } from './timer';
import { RPCResponse } from '@/types';
import { getNodeErrorCounts, getSessionToken, storeNodeErrorCounts } from './dataHelpers';

//indexer specific error - i.e tx submitted, but indexer disabled so returned incorrect

const isIndexerError = (error: any): boolean => {
  return (
    error?.message?.includes('transaction indexing is disabled') ||
    error?.message?.includes('indexing is disabled')
  );
};

// Select and prioritize node providers based on their error counts
export const selectNodeProviders = () => {
  const errorCounts = getNodeErrorCounts();

  // Get node providers and their respective error counts
  const providers = CHAIN_NODES.symphonytestnet.map(provider => ({
    ...provider,
    failCount: errorCounts[provider.rpc] || 0,
  }));

  // Sort providers based on failCount, with lower fail counts first
  return providers.sort((a, b) => a.failCount - b.failCount);
};

// Increment the error count for a specific provider
export const incrementErrorCount = (nodeProvider: string): void => {
  const errorCounts = getNodeErrorCounts();
  errorCounts[nodeProvider] = (errorCounts[nodeProvider] || 0) + 1;
  storeNodeErrorCounts(errorCounts);
};

// Helper: Perform a REST API query to a selected node
const performRestQuery = async (
  endpoint: string,
  queryMethod: string,
  queryType: 'POST' | 'GET',
) => {
  const response = await fetch(`${queryMethod}${endpoint}`, {
    method: queryType,
    body: null,
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Node query failed');
  }

  return await response.json();
};

// TODO: modify to support multi-send
// Helper: Perform an RPC query using signing, such as for claiming rewards or staking
export const performRpcQuery = async (
  client: SigningStargateClient,
  walletAddress: string,
  messages: any[],
  feeDenom: string,
  simulateOnly = false,
  fee?: {
    amount: { denom: string; amount: string }[];
    gas: string;
  },
): Promise<RPCResponse> => {
  try {
    // TODO: modify to support multi-send
    let calculatedFee = fee;

    if (!fee || !calculatedFee) {
      const defaultGasPrice = GasPrice.fromString(`0.025${feeDenom}`);
      let gasEstimation = await client.simulate(walletAddress, messages, '');
      gasEstimation = Math.ceil(gasEstimation * 1.1);

      calculatedFee = {
        amount: [
          {
            denom: feeDenom,
            amount: (gasEstimation * defaultGasPrice.amount.toFloatApproximation()).toFixed(0),
          },
        ],
        gas: gasEstimation.toString(),
      };
    }

    if (simulateOnly) {
      return {
        code: 0,
        message: 'Simulation success',
        fee: calculatedFee,
        gasWanted: calculatedFee.gas,
      };
    }

    const result = await client.signAndBroadcast(walletAddress, messages, calculatedFee);

    if (result.code === 0) {
      return {
        code: 0,
        txHash: result.transactionHash,
        gasUsed: result.gasUsed?.toString(),
        gasWanted: result.gasWanted?.toString(),
        message: 'Transaction success',
      };
    }

    throw new Error(`Transaction failed with ${result.code}`);
  } catch (error: any) {
    // TODO: find another way to verify transaction success.
    // TODO: log indexer errors, changeover to backups (can be original endpoints).  no single points of failure
    if (isIndexerError(error)) {
      return {
        code: 1,
        message: 'Node indexer disabled',
        txHash: error.txHash || 'unknown',
      };
    }
    throw error;
  }
};

const queryWithRetry = async ({
  endpoint,
  useRPC = false,
  queryType = 'GET',
  messages = [],
  feeDenom,
  simulateOnly = false,
  fee,
}: {
  endpoint: string;
  useRPC?: boolean;
  queryType?: 'GET' | 'POST';
  messages?: any[];
  feeDenom: string;
  simulateOnly?: boolean;
  fee?: {
    amount: { denom: string; amount: string }[];
    gas: string;
  };
}): Promise<RPCResponse> => {
  const providers = selectNodeProviders();
  let numberAttempts = 0;
  let lastError: any = null;

  while (numberAttempts < MAX_NODES_PER_QUERY) {
    for (const provider of providers) {
      try {
        const queryMethod = useRPC ? provider.rpc : provider.rest;

        if (useRPC) {
          const sessionToken = getSessionToken();
          if (!sessionToken) {
            throw new Error("Session token doesn't exist");
          }
          const mnemonic = sessionToken.mnemonic;
          const address = await getAddress(mnemonic);
          const offlineSigner = await createOfflineSignerFromMnemonic(mnemonic);
          const client = await SigningStargateClient.connectWithSigner(queryMethod, offlineSigner);

          const result = await performRpcQuery(
            client,
            address,
            messages,
            feeDenom,
            simulateOnly,
            fee,
          );
          return result;
        } else {
          const result = await performRestQuery(endpoint, queryMethod, queryType);
          return result;
        }
      } catch (error) {
        lastError = error;
        console.error('Error querying node:', error);

        if (!isIndexerError(error)) {
          incrementErrorCount(provider.rpc);
        }
      }

      numberAttempts++;
      if (numberAttempts >= MAX_NODES_PER_QUERY) break;
      await delay(DELAY_BETWEEN_NODE_ATTEMPTS);
    }
  }

  if (isIndexerError(lastError)) {
    return {
      code: 0,
      message: 'Transaction likely successful (indexer disabled)',
      txHash: lastError?.txHash || 'unknown',
    };
  }

  throw new Error(
    `All node query attempts failed after ${MAX_NODES_PER_QUERY} attempts. ${lastError?.message || ''}`,
  );
};

export const queryRestNode = async ({
  endpoint,
  queryType = 'GET',
  feeDenom = LOCAL_ASSET_REGISTRY.note.denom,
}: {
  endpoint: string;
  queryType?: 'GET' | 'POST';
  feeDenom?: string;
}) =>
  queryWithRetry({
    endpoint,
    useRPC: false,
    queryType,
    feeDenom,
  });

export const queryRpcNode = async ({
  endpoint,
  messages,
  feeDenom = LOCAL_ASSET_REGISTRY.note.denom,
  simulateOnly = false,
  fee,
}: {
  endpoint: string;
  messages?: any[];
  feeDenom?: string;
  simulateOnly?: boolean;
  fee?: {
    amount: { denom: string; amount: string }[];
    gas: string;
  };
}) =>
  queryWithRetry({
    endpoint,
    useRPC: true,
    messages,
    feeDenom,
    simulateOnly,
    fee,
  });
