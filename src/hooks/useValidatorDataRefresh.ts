import { isFetchingValidatorDataAtom, validatorDataAtom, walletAddressAtom } from '@/atoms';
import { fetchValidatorData } from '@/helpers';
import { useAtom, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';

export function useValidatorDataRefresh() {
  const [walletAddress] = useAtom(walletAddressAtom);
  const setValidatorState = useSetAtom(validatorDataAtom);
  const setIsFetchingData = useSetAtom(isFetchingValidatorDataAtom);

  const [refreshEnabled, setRefreshEnabled] = useState(true);

  const refreshValidatorData = async (address?: string) => {
    const targetAddress = address || walletAddress;
    if (targetAddress) {
      setIsFetchingData(true);
      console.log('Fetching new validator data for address:', walletAddress);

      try {
        const newValidatorData = await fetchValidatorData(walletAddress);
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

  useEffect(() => {
    if (refreshEnabled && walletAddress) {
      refreshValidatorData();
    }
  }, [walletAddress]);

  const triggerValidatorDataRefresh = (address?: string) => {
    setRefreshEnabled(false);
    refreshValidatorData(address).then(() => {
      setRefreshEnabled(true);
    });
  };

  return { triggerValidatorDataRefresh };
}
