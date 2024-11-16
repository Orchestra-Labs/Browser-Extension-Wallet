import {
  IBC_PREFIX,
  LOCAL_ASSET_REGISTRY,
  GREATER_EXPONENT_DEFAULT,
  CHAIN_ENDPOINTS,
  LOCAL_CHAIN_REGISTRY,
} from '@/constants';
import { Asset, SubscriptionRecord } from '@/types';
import { queryRestNode } from './queryNodes';

const adjustAmountByExponent = (amount: string, exponent: number): string => {
  const divisor = Math.pow(10, exponent);
  return (parseFloat(amount) / divisor).toFixed(exponent);
};

// TODO: get IBC channel information from registry (getting from query doesn't include channel ID)
const resolveIbcDenom = async (
  ibcDenom: string,
): Promise<{ denom: string; symbol: string; logo?: string; exponent: number }> => {
  try {
    const denomHash = ibcDenom.slice(4); // Remove the "ibc/" prefix
    const getIBCInfoEndpoint = CHAIN_ENDPOINTS.getIBCInfo;

    // Use queryNode to try multiple nodes
    const response = await queryRestNode({ endpoint: `${getIBCInfoEndpoint}${denomHash}` });
    const baseDenom = response.denom_trace?.base_denom;

    if (!baseDenom) {
      // TODO: show error to user
      throw new Error(`Failed to resolve IBC denom: ${ibcDenom}`);
    }

    // Check local registry for base denom information
    const registryAsset = LOCAL_ASSET_REGISTRY[baseDenom] || null;
    let symbol: string;
    let logo: string | undefined;
    let exponent: number;

    if (registryAsset) {
      symbol = registryAsset.symbol ?? baseDenom;
      logo = registryAsset.logo;
      exponent = registryAsset.exponent ?? GREATER_EXPONENT_DEFAULT;
    } else {
      symbol = baseDenom;
      logo = undefined;
      exponent = GREATER_EXPONENT_DEFAULT;
    }

    return { denom: baseDenom, symbol, logo, exponent };
  } catch (error) {
    console.error(`Error resolving IBC denom ${ibcDenom}:`, error);
    throw error;
  }
};

const getBalances = async (walletAddress: string): Promise<Asset[]> => {
  const getBalanceEndpoint = CHAIN_ENDPOINTS.getBalance;

  // Use queryNode to try querying balances across nodes
  const response = await queryRestNode({ endpoint: `${getBalanceEndpoint}${walletAddress}` });

  if (!response.balances) {
    // TODO: show error to user
    throw new Error(`Failed to fetch balances for address: ${walletAddress}`);
  }

  return response.balances;
};

export async function fetchWalletAssets(
  walletAddress: string,
  networkID: string,
  subscription: SubscriptionRecord,
): Promise<Asset[]> {
  if (!walletAddress) {
    console.error('No wallet address available in walletState!');
    return [];
  }

  try {
    console.log(`Fetching assets for wallet address: ${walletAddress}, network ID: ${networkID}`);

    const coins: Asset[] = await getBalances(walletAddress);
    console.log('Coins fetched from getBalances:', coins);

    const coinDenoms: string[] = subscription.coinDenoms || [];
    const networkName = LOCAL_CHAIN_REGISTRY[networkID]?.chainName || 'Unknown Network';

    // Filter assets if coinDenoms is not empty, otherwise include all
    const filteredCoins =
      coinDenoms.length > 0 ? coins.filter(coin => coinDenoms.includes(coin.denom)) : coins;
    console.log('Filtered coins after applying subscription filter:', filteredCoins);

    // Map through the balances and resolve their properties
    const walletAssets = await Promise.all(
      filteredCoins.map(async (coin: Asset) => {
        console.log(`Processing coin: ${coin.denom}, amount: ${coin.amount}`);

        let symbol: string;
        let logo: string | undefined;
        let exponent: number;

        const registryAsset = LOCAL_ASSET_REGISTRY[coin.denom] || null;
        console.log(`Registry asset lookup for ${coin.denom}:`, registryAsset);

        if (!registryAsset) {
          symbol = coin.denom;
          exponent = GREATER_EXPONENT_DEFAULT;
          logo = undefined;
        } else {
          symbol = registryAsset.symbol ?? coin.denom;
          exponent = registryAsset.exponent ?? GREATER_EXPONENT_DEFAULT;
          logo = registryAsset.logo;
        }

        // Adjust the coin amount by the exponent (shift decimal)
        const adjustedAmount = adjustAmountByExponent(coin.amount, exponent);
        console.log(`Adjusted amount for ${coin.denom}:`, adjustedAmount);

        if (coin.denom.startsWith(IBC_PREFIX)) {
          // Resolve IBC denom details
          console.log(`Resolving IBC denom for: ${coin.denom}`);
          const {
            denom: resolvedDenom,
            symbol: resolvedSymbol,
            logo: resolvedLogo,
            exponent: resolvedExponent,
          } = await resolveIbcDenom(coin.denom);

          // Adjust the amount based on the resolved exponent
          const resolvedAmount = adjustAmountByExponent(coin.amount, resolvedExponent);

          return {
            ...coin,
            denom: resolvedDenom,
            symbol: resolvedSymbol,
            logo: resolvedLogo,
            exponent: resolvedExponent,
            amount: resolvedAmount,
            isIbc: true,
            networkName,
            networkID,
          };
        }

        return {
          ...coin,
          symbol,
          logo,
          exponent,
          amount: adjustedAmount,
          isIbc: false,
          networkName,
          networkID,
        };
      }),
    );

    console.log('Final wallet assets:', walletAssets);
    return walletAssets;
  } catch (error) {
    console.error('Error fetching wallet assets:', error);
    return [];
  }
}
