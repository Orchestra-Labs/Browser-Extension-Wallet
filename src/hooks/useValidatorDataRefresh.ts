import { fetchValidatorData } from '@/helpers';
import { validatorDataAtom, shouldRefreshDataAtom, walletStateAtom } from '@/atoms';
import { useAtomValue, useSetAtom } from 'jotai';

export function useValidatorDataRefresh() {
  const walletState = useAtomValue(walletStateAtom);
  const setValidatorState = useSetAtom(validatorDataAtom);
  const setIsRefreshing = useSetAtom(shouldRefreshDataAtom);

  const refreshValidatorData = async () => {
    const delegatorAddress = walletState.address;

    try {
      const newValidatorData = await fetchValidatorData(delegatorAddress);
      setValidatorState(prevState => ({
        ...prevState,
        validators: newValidatorData,
      }));
    } catch (error) {
      console.error('Error refreshing validator data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return { refreshValidatorData };
}
