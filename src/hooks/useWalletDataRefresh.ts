import { walletAssetsAtom, walletAddressAtom, isFetchingWalletDataAtom } from '@/atoms';
import { fetchWalletAssets } from '@/helpers';
import { useAtom, useSetAtom } from 'jotai';

export function useWalletAssetsRefresh() {
  const [walletAddress] = useAtom(walletAddressAtom);
  const setWalletAssets = useSetAtom(walletAssetsAtom);
  const setIsFetchingData = useSetAtom(isFetchingWalletDataAtom);

  const refreshWalletAssets = async (address?: string) => {
    const targetAddress = address || walletAddress;
    console.log('Triggered refreshWalletAssets with targetAddress:', targetAddress);

    if (targetAddress) {
      setIsFetchingData(true);
      console.log('Fetching new wallet assets for address:', targetAddress);

      try {
        const newAssets = await fetchWalletAssets(targetAddress);
        console.log('Fetched wallet assets:', newAssets);
        setWalletAssets(newAssets);
      } catch (error) {
        console.error('Error refreshing wallet assets:', error);
      } finally {
        console.log('Setting isFetchingWalletDataAtom to false');
        setIsFetchingData(false);
      }
    } else {
      console.log('Skipped refreshing wallet assets. targetAddress is missing.');
    }
  };

  const triggerWalletDataRefresh = (address?: string) => {
    console.log('triggerWalletDataRefresh called with address:', address);
    refreshWalletAssets(address);
  };

  return { triggerWalletDataRefresh };
}
