import { fetchWalletAssets } from '@/helpers';
import { walletStateAtom, isRefreshingAtom } from '@/atoms';
import { useAtom, useSetAtom } from 'jotai';

export function useWalletAssetsRefresh() {
  const [walletState, setWalletState] = useAtom(walletStateAtom);
  const setIsRefreshing = useSetAtom(isRefreshingAtom);
  console.log('refresh called, using hook');

  const refreshWalletAssets = async () => {
    try {
      const newAssets = await fetchWalletAssets(walletState);

      setWalletState(prevState => ({
        ...prevState,
        assets: newAssets,
      }));
    } catch (error) {
      console.error('Error refreshing wallet assets:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return { refreshWalletAssets };
}
