import {
  isFetchingWalletDataAtom,
  isInitialDataLoadAtom,
  userWalletAtom,
  validatorDataAtom,
  walletAssetsAtom,
} from '@/atoms';
import { userAccountAtom } from '@/atoms/accountAtom';
import { getWalletByID } from '@/helpers/dataHelpers/account';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect } from 'react';

export const DataProvider: React.FC<{}> = ({}) => {
  const [walletAssets] = useAtom(walletAssetsAtom);
  const [isInitialDataLoad, setIsInitialDataLoad] = useAtom(isInitialDataLoadAtom);
  const isFetchingWalletData = useAtomValue(isFetchingWalletDataAtom);
  const validatorState = useAtomValue(validatorDataAtom);
  const isFetchingValidatorData = useAtomValue(isFetchingWalletDataAtom);
  const account = useAtomValue(userAccountAtom);
  const setWallet = useSetAtom(userWalletAtom);

  useEffect(() => {
    if (isInitialDataLoad) {
      const initialLoadHasCompleted =
        !isFetchingWalletData &&
        !isFetchingValidatorData &&
        (walletAssets.length > 0 || validatorState.length > 0);

      if (initialLoadHasCompleted) {
        setIsInitialDataLoad(false);
      }
    }
  }, [
    isInitialDataLoad,
    isFetchingWalletData,
    isFetchingValidatorData,
    walletAssets,
    validatorState,
  ]);

  useEffect(() => {
    if (account) {
      const wallet = getWalletByID(account, account.settings.activeWalletID);
      if (wallet) setWallet(wallet);
    }
  }, [account]);

  return null;
};
