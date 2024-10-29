import { useState, useEffect } from 'react';
import { Asset } from '@/types';
import { LOCAL_ASSET_REGISTRY, CHAIN_ENDPOINTS } from '@/constants';
import { queryRestNode } from '@/helpers';
import { useAtomValue } from 'jotai';
import { walletStateAtom } from '@/atoms';

interface ExchangeRequirementResponse {
  exchange_requirements: {
    base_currency: {
      denom: string;
      amount: string;
    };
    exchange_rate: string;
  }[];
  total: {
    denom: string;
    amount: string;
  };
}

export const useExchangeAssets = () => {
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const walletState = useAtomValue(walletStateAtom);

  const fetchExchangeAssets = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = (await queryRestNode({
        endpoint: `${CHAIN_ENDPOINTS.exchangeRequirements}`,
        queryType: 'GET',
      })) as unknown as ExchangeRequirementResponse;

      if (!response.exchange_requirements) {
        throw new Error('Invalid response format');
      }

      // Transform exchange requirements into assets
      const exchangeAssets = response.exchange_requirements
        .filter(req => req.base_currency.denom !== 'note')
        .reduce<Asset[]>((acc, req) => {
          const registryAsset = LOCAL_ASSET_REGISTRY[req.base_currency.denom];

          if (!registryAsset) {
            console.warn(`Asset ${req.base_currency.denom} not found in registry`);
            return acc;
          }

          // Just use registry asset properties with the new amount
          const newAsset: Asset = {
            ...registryAsset,
            amount: req.base_currency.amount,
          };

          return [...acc, newAsset];
        }, []);

      // Combine wallet assets and exchange assets
      const walletAssets = walletState?.assets || [];

      // Create a map of existing denoms to avoid duplicates
      const existingDenoms = new Set(walletAssets.map(asset => asset.denom));

      // Only add exchange assets that aren't in the wallet
      const uniqueExchangeAssets = exchangeAssets.filter(asset => !existingDenoms.has(asset.denom));

      // Combine all assets
      const combinedAssets = [...walletAssets, ...uniqueExchangeAssets];

      setAvailableAssets(combinedAssets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exchange assets');
      console.error('Error fetching exchange assets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // TODO: examine why refetch on wallet change and why this depends on existing wallet asset information
  useEffect(() => {
    fetchExchangeAssets();
  }, [walletState?.assets]); // Refetch when wallet assets change

  return {
    availableAssets,
    isLoading,
    error,
    refetch: fetchExchangeAssets,
  };
};
