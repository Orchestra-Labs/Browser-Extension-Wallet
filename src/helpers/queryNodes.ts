import {
  CHAIN_NODES,
  DELAY_BETWEEN_NODE_ATTEMPTS,
  LOCAL_ASSET_REGISTRY,
  MAX_NODES_PER_QUERY,
} from '@/constants';
import { getNodeErrorCounts, getSessionToken, storeNodeErrorCounts } from './localStorage';
import { SigningStargateClient, GasPrice } from '@cosmjs/stargate';
import { createOfflineSignerFromMnemonic } from './wallet';
import { delay } from './timer';
import { RPCResponse } from '@/types';

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
): Promise<RPCResponse> => {
  try {
    // TODO: modify to support multi-send
    // Set a default fee for simulation
    const defaultGasPrice = GasPrice.fromString(`0.025${feeDenom}`);

    // TODO: add simulation parameter to functions to be able to update user on estimates in real time before real query
    // Simulate transaction to estimate gas
    let gasEstimation = await client.simulate(walletAddress, messages, '');
    // Apply a 10% buffer for safety
    gasEstimation = Math.ceil(gasEstimation * 1.1);

    // Calculate the fee based on the gas estimation
    const fee = {
      amount: [
        {
          denom: feeDenom,
          amount: (gasEstimation * defaultGasPrice.amount.toFloatApproximation()).toFixed(0),
        },
      ],
      gas: gasEstimation.toString(),
    };

    // If simulation-only, estimate the gas and return without broadcasting
    if (simulateOnly) {
      return { code: 0, message: 'Simulation success', fee, gasWanted: gasEstimation.toString() };
    }

    // Otherwise, proceed with full transaction
    const result = await client.signAndBroadcast(walletAddress, messages, fee);

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

    // Re-throw all other errors
    throw error;
  }
};

// Function to query the node with retries and delay
const queryWithRetry = async ({
  endpoint,
  useRPC = false,
  queryType = 'GET',
  messages = [],
  feeDenom,
  simulateOnly = false,
}: {
  endpoint: string;
  useRPC?: boolean;
  queryType?: 'GET' | 'POST';
  messages?: any[];
  feeDenom: string;
  simulateOnly?: boolean;
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
            throw new Error('Session token doesnt exist');
          }
          const mnemonic = sessionToken.mnemonic;
          const address = sessionToken.address;
          if (!mnemonic) {
            throw new Error('Wallet is locked or unavailable');
          }

          const offlineSigner = await createOfflineSignerFromMnemonic(mnemonic);
          const client = await SigningStargateClient.connectWithSigner(queryMethod, offlineSigner);

          // Pass `simulateOnly` to determine if we are simulating or fully querying
          const result = await performRpcQuery(client, address, messages, feeDenom, simulateOnly);
          return result;
        } else {
          const result = await performRestQuery(endpoint, queryMethod, queryType);
          return result;
        }
      } catch (error) {
        lastError = error;
        console.error('Error querying node:', error);

        // Don't increment error count for indexer issues
        if (!isIndexerError(error)) {
          incrementErrorCount(provider.rpc);
        }
      }

      numberAttempts++;
      if (numberAttempts >= MAX_NODES_PER_QUERY) break;
      await delay(DELAY_BETWEEN_NODE_ATTEMPTS);
    }
  }

  // If we got here and the last error was an indexer error
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

// REST query function
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

// RPC query function
export const queryRpcNode = async ({
  endpoint,
  messages,
  feeDenom = LOCAL_ASSET_REGISTRY.note.denom,
  simulateOnly = false,
}: {
  endpoint: string;
  messages?: any[];
  feeDenom?: string;
  simulateOnly?: boolean;
}) =>
  queryWithRetry({
    endpoint,
    useRPC: true,
    messages,
    feeDenom,
    simulateOnly,
  });
