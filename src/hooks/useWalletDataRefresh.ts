import { walletAssetsAtom, walletAddressAtom, isFetchingWalletDataAtom } from '@/atoms';
import { fetchWalletAssets } from '@/helpers';
import { useAtom, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';

export function useWalletAssetsRefresh() {
  const [walletAddress] = useAtom(walletAddressAtom);
  const setWalletAssets = useSetAtom(walletAssetsAtom);
  const setIsFetchingData = useSetAtom(isFetchingWalletDataAtom);

  const [refreshEnabled, setRefreshEnabled] = useState(true);

  const refreshWalletAssets = async (address?: string) => {
    const targetAddress = address || walletAddress;
    if (targetAddress) {
      setIsFetchingData(true);
      console.log('Fetching new wallet assets for address:', walletAddress);

      try {
        const newAssets = await fetchWalletAssets(walletAddress);
        console.log('Fetched wallet assets:', newAssets);
        setWalletAssets(newAssets);
      } catch (error) {
        console.error('Error refreshing wallet assets:', error);
      } finally {
        console.log('Setting shouldRefreshData to false');
        setIsFetchingData(false);
      }
    } else {
      console.log(
        'Skipped refreshing wallet assets. Either shouldRefreshData is false or walletAddress is missing.',
      );
    }
  };

  useEffect(() => {
    if (refreshEnabled && walletAddress) {
      refreshWalletAssets();
    }
  }, [walletAddress]);

  const triggerWalletDataRefresh = (address?: string) => {
    setRefreshEnabled(false);
    refreshWalletAssets(address).then(() => {
      setRefreshEnabled(true);
    });
  };

  return { triggerWalletDataRefresh };
}
