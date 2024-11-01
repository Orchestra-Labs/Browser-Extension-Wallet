import { fetchWalletAssets } from '@/helpers';
import { walletStateAtom, isRefreshingAtom } from '@/atoms';
import { useAtom } from 'jotai';

export function useWalletAssetsRefresh() {
  const [walletState, setWalletState] = useAtom(walletStateAtom);
  const [isRefreshing, setIsRefreshing] = useAtom(isRefreshingAtom);

  const refreshWalletAssets = async () => {
    if (isRefreshing) {
      console.log('refreshing data');

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
    }
  };

  return { refreshWalletAssets };
}
