import { isFetchingValidatorDataAtom, validatorDataAtom, walletAddressAtom } from '@/atoms';
import { fetchValidatorData } from '@/helpers';
import { useAtom, useSetAtom } from 'jotai';

export function useValidatorDataRefresh() {
  const [walletAddress] = useAtom(walletAddressAtom);
  const setValidatorState = useSetAtom(validatorDataAtom);
  const setIsFetchingData = useSetAtom(isFetchingValidatorDataAtom);

  const refreshValidatorData = async (address?: string) => {
    const targetAddress = address || walletAddress;
    console.log('Triggered refreshValidatorData with targetAddress:', targetAddress);

    if (targetAddress) {
      setIsFetchingData(true);
      console.log('Fetching new validator data for address:', targetAddress);

      try {
        const newValidatorData = await fetchValidatorData(targetAddress);
        console.log('Fetched validator data:', newValidatorData);
        setValidatorState(newValidatorData);
      } catch (error) {
        console.error('Error refreshing validator data:', error);
      } finally {
        console.log('Setting shouldRefreshData to false');
        setIsFetchingData(false);
      }
    } else {
      console.log(
        'Skipped refreshing validator data. Either shouldRefreshData is false or walletAddress is missing.',
      );
    }
  };

  const triggerValidatorDataRefresh = (address?: string) => {
    console.log('triggerValidatorDataRefresh called with address:', address);
    refreshValidatorData(address);
  };

  return { triggerValidatorDataRefresh };
}
