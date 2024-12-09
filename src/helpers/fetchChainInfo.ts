import { ChainRecord } from '@/types';

const MAINNET_CHAINS_URL = 'https://chains.cosmos.directory/';

export const fetchChains = async (): Promise<ChainRecord[]> => {
  try {
    const response = await fetch(MAINNET_CHAINS_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch mainnet chains: ${response.statusText}`);
    }

    const chains = await response.json();

    const organizedChains: ChainRecord[] = chains.map((chain: any) => ({
      name: chain.name || 'Unknown',
      chainId: chain.chain_id || 'Unknown',
      rpcUrls: chain.apis?.rpc?.map((rpc: any) => rpc.address) || [],
      restUrls: chain.apis?.rest?.map((rest: any) => rest.address) || [],
      status: chain.status || 'inactive',
    }));

    return organizedChains;
  } catch (error) {
    console.error('Error fetching and organizing mainnet chains:', error);
    throw error;
  }
};
