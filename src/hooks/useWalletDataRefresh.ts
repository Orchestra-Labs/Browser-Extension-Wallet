import { walletAssetsAtom, walletAddressAtom, isFetchingWalletDataAtom } from '@/atoms';
import { fetchWalletAssets } from '@/helpers';
import { useAtom, useSetAtom } from 'jotai';

export function useWalletAssetsRefresh() {
  const [walletAddress] = useAtom(walletAddressAtom);
  const setWalletAssets = useSetAtom(walletAssetsAtom);
  const setIsFetchingData = useSetAtom(isFetchingWalletDataAtom);

  const refreshWalletAssets = async (address?: string) => {
    const targetAddress = address || walletAddress;

    if (targetAddress) {
      setIsFetchingData(true);

      try {
        const newAssets = await fetchWalletAssets(targetAddress);
        setWalletAssets(newAssets);
      } catch (error) {
        console.error('Error refreshing wallet assets:', error);
      } finally {
        setIsFetchingData(false);
      }
    }
  };

  const triggerWalletDataRefresh = (address?: string) => {
    refreshWalletAssets(address);
  };

  return { triggerWalletDataRefresh };
}
