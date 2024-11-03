import { useState, useEffect } from 'react';
import { Asset } from '@/types';
import {
  LOCAL_ASSET_REGISTRY,
  DEFAULT_ASSET,
  CHAIN_ENDPOINTS,
  GREATER_EXPONENT_DEFAULT,
} from '@/constants';
import { queryRestNode } from '@/helpers';
import { useAtomValue } from 'jotai';
import { sendStateAtom } from '@/atoms';
import BigNumber from 'bignumber.js';

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

  const fetchExchangeAssets = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const defaultAsset = DEFAULT_ASSET;
      const sendAsset = sendState.asset;

      console.log('Fetching exchange assets...');
      const response = (await queryRestNode({
        endpoint: `${CHAIN_ENDPOINTS.exchangeRequirements}`,
        queryType: 'GET',
      })) as unknown as ExchangeRequirementResponse;

      console.log('Raw response from API:', response);

      if (!response.exchange_requirements) {
        throw new Error('Invalid response format');
      }

      let adjustmentRate = 1;

      // If sendAsset is different from DEFAULT_ASSET, get the exchange rate from sendAsset to DEFAULT_ASSET
      if (sendAsset.denom !== defaultAsset.denom) {
        const exchangeRateResponse = await queryRestNode({
          endpoint: `${CHAIN_ENDPOINTS.swap}offerCoin=1000000${sendAsset.denom}&askDenom=${defaultAsset.denom}`,
          queryType: 'GET',
        });

        adjustmentRate = parseFloat(exchangeRateResponse.return_coin.amount) / 1000000;
        console.log(
          `Adjustment rate from ${sendAsset.denom} to ${defaultAsset.denom}:`,
          adjustmentRate,
        );
      }

      const exchangeAssets = Object.values(LOCAL_ASSET_REGISTRY).map(registryAsset => {
        const exchangeRequirement = response.exchange_requirements.find(
          req => req.base_currency.denom === registryAsset.denom,
        );

        let exchangeRate;

        if (registryAsset.denom === sendAsset.denom) {
          exchangeRate = '1';
        } else if (registryAsset.isIbc) {
          exchangeRate = '-';
        } else {
          const baseExchangeRate = parseFloat(exchangeRequirement?.exchange_rate || '1');
          const exponent = sendAsset.exponent || GREATER_EXPONENT_DEFAULT;
          exchangeRate = new BigNumber(baseExchangeRate)
            .dividedBy(adjustmentRate)
            .toFixed(exponent);
        }

        return {
          ...registryAsset,
          amount: exchangeRequirement?.base_currency.amount || '0',
          exchangeRate,
        };
      });

      console.log('Final available assets with adjusted rates:', exchangeAssets);
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
