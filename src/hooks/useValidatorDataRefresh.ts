import { fetchValidatorData } from '@/helpers';
import { validatorDataAtom, shouldRefreshDataAtom, walletStateAtom } from '@/atoms';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';

export function useValidatorDataRefresh() {
  const walletState = useAtomValue(walletStateAtom);
  const setValidatorState = useSetAtom(validatorDataAtom);
  const [shouldRefreshData, setShouldRefreshData] = useAtom(shouldRefreshDataAtom);

  const refreshValidatorData = async () => {
    // Control refresh
    if (shouldRefreshData) {
      console.log('refreshing validator data');
      const delegatorAddress = walletState.address;

      try {
        const newValidatorData = await fetchValidatorData(delegatorAddress);
        setValidatorState(newValidatorData);
      } catch (error) {
        console.error('Error refreshing validator data:', error);
      } finally {
        setShouldRefreshData(false);
      }
    }
  };

  return { refreshValidatorData };
}
