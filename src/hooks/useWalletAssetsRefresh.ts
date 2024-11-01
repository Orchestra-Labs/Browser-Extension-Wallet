import { fetchWalletAssets } from '@/helpers';
import { walletStateAtom, shouldRefreshDataAtom } from '@/atoms';
import { useAtom } from 'jotai';

export function useWalletAssetsRefresh() {
  const [walletState, setWalletState] = useAtom(walletStateAtom);
  const [shouldRefreshData, setShouldRefreshData] = useAtom(shouldRefreshDataAtom);

  const refreshWalletAssets = async () => {
    if (shouldRefreshData) {
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
        setShouldRefreshData(false);
      }
    }
  };

  return { refreshWalletAssets };
}
