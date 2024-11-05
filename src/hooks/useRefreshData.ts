import { useAtom } from 'jotai';
import { useValidatorDataRefresh } from './useValidatorDataRefresh';
import { useWalletAssetsRefresh } from './useWalletDataRefresh';
import { walletAddressAtom } from '@/atoms';

export function useRefreshData() {
  const [walletAddress] = useAtom(walletAddressAtom);
  const { triggerWalletDataRefresh } = useWalletAssetsRefresh();
  const { triggerValidatorDataRefresh } = useValidatorDataRefresh();

  const refreshData = async ({
    wallet = true,
    validator = true,
    address,
  }: { wallet?: boolean; validator?: boolean; address?: string } = {}) => {
    console.log('refreshData called with wallet:', wallet, 'validator:', validator);
    const targetAddress = address || walletAddress;
    console.log('target Address set to:', targetAddress);

    if (wallet) {
      console.log('Triggering wallet data refresh with address', targetAddress);
      triggerWalletDataRefresh(targetAddress);
    }
    if (validator) {
      console.log('Triggering validator data refresh with address', targetAddress);
      triggerValidatorDataRefresh(targetAddress);
    }
  };

  return { refreshData };
}
