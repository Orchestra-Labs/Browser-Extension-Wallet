import { CHAIN_NODES, DELAY_BETWEEN_NODE_ATTEMPTS, MAX_NODES_PER_QUERY } from '@/constants';
import { getNodeErrorCounts, storeNodeErrorCounts } from './localStorage';

// TODO: move to its own time-based helpers file
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Select and prioritize node providers based on their error counts
const selectNodeProviders = () => {
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
const incrementErrorCount = (nodeProvider: string): void => {
  const errorCounts = getNodeErrorCounts();
  errorCounts[nodeProvider] = (errorCounts[nodeProvider] || 0) + 1;
  storeNodeErrorCounts(errorCounts);
};

// Function to query the node with retries and delay
export const queryNode = async (
  endpoint: string,
  queryBody: string = '',
  useRPC: boolean = false,
  queryType: 'POST' | 'GET' = 'GET',
): Promise<any> => {
  const providers = selectNodeProviders();
  console.log('Selected node providers:', providers); // Log selected node providers

  let numberAttempts = 0;

  while (numberAttempts < MAX_NODES_PER_QUERY) {
    for (const provider of providers) {
      try {
        const queryMethod = useRPC ? provider.rpc : provider.rest;
        console.log(`Querying node ${queryMethod} with endpoint: ${endpoint}`); // Log each request

        const response = await fetch(`${queryMethod}${endpoint}`, {
          method: queryType,
          body: queryBody || null,
          headers: { 'Content-Type': 'application/json' },
        });

        console.log('Response from node:', response); // Log the raw response

        if (!response.ok) {
          throw new Error('Node query failed');
        }

        return await response.json();
      } catch (error) {
        incrementErrorCount(provider.rpc);
        console.error('Error querying node:', error); // Log any errors
      }
      numberAttempts++;

      if (numberAttempts >= MAX_NODES_PER_QUERY) {
        break;
      }

      await delay(DELAY_BETWEEN_NODE_ATTEMPTS);
    }
  }

  throw new Error(`All node query attempts failed after ${MAX_NODES_PER_QUERY} attempts.`);
};
