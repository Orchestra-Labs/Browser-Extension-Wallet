import { useValidatorDataRefresh } from './useValidatorDataRefresh';
import { useWalletAssetsRefresh } from './useWalletDataRefresh';

export function useRefreshData() {
  const { triggerWalletDataRefresh } = useWalletAssetsRefresh();
  const { triggerValidatorDataRefresh } = useValidatorDataRefresh();

  // Function to selectively refresh wallet, validator, or both
  const refreshData = async ({ wallet = true, validator = true } = {}) => {
    if (wallet) {
      triggerWalletDataRefresh();
    }
    if (validator) {
      triggerValidatorDataRefresh();
    }
  };

  return { refreshData };
}
