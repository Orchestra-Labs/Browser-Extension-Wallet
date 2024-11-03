import { useState, useEffect } from 'react';
import { Asset } from '@/types';
import { LOCAL_ASSET_REGISTRY, DEFAULT_ASSET, CHAIN_ENDPOINTS } from '@/constants';
import { queryRestNode } from '@/helpers';
import { useAtomValue } from 'jotai';
import { sendStateAtom } from '@/atoms';

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
  const sendState = useAtomValue(sendStateAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // TODO: if send asset is not default asset, convert to default asset as simulation) before checking rates against these.
  const fetchExchangeAssets = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: if sendState.asset.denom and sendState.asset.isIbc are not equal to DEFAULT_ASSET, get exchange rate to DEFAULT ASSET and multiple all exchange rates by that value before returning
      const defaultAsset = sendState.asset || DEFAULT_ASSET;

      console.log('Fetching exchange assets...');
      const response = (await queryRestNode({
        endpoint: `${CHAIN_ENDPOINTS.exchangeRequirements}`,
        queryType: 'GET',
      })) as unknown as ExchangeRequirementResponse;

      console.log('Raw response from API:', response);

      if (!response.exchange_requirements) {
        throw new Error('Invalid response format');
      }

      const exchangeAssets = Object.values(LOCAL_ASSET_REGISTRY).map(registryAsset => {
        const exchangeRequirement = response.exchange_requirements.find(
          req => req.base_currency.denom === registryAsset.denom,
        );

        console.log('registry asset', registryAsset.symbol, registryAsset);
        const exchangeRate =
          registryAsset.denom === defaultAsset.denom
            ? `1 ${registryAsset.symbol}`
            : registryAsset.isIbc
              ? '-'
              : (1 / parseFloat(exchangeRequirement?.exchange_rate || '1')).toFixed(
                  registryAsset.exponent,
                );

        return {
          ...registryAsset,
          amount: exchangeRequirement?.base_currency.amount || '0',
          exchangeRate,
        };
      });

      console.log('Final available assets:', exchangeAssets);
      setAvailableAssets(exchangeAssets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch exchange assets');
      console.error('Error fetching exchange assets:', err);
    } finally {
      setIsLoading(false);
      console.log('Finished fetching exchange assets.');
    }
  };

  useEffect(() => {
    fetchExchangeAssets();
  }, []);

  return {
    availableAssets,
    isLoading,
    error,
    refetch: fetchExchangeAssets,
  };
};
