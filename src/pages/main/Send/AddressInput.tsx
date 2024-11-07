import { Input } from '@/ui-kit';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { addressVerifiedAtom, recipientAddressAtom, walletStateAtom } from '@/atoms';
import { useEffect, useState } from 'react';
import { WALLET_PREFIX } from '@/constants';
import { cn } from '@/helpers';
import { QRCodeScannerDialog } from '@/components';
import { Asset } from '@/types';

interface AddressInputProps {
  addBottomMargin?: boolean;
  labelWidth?: string;
  updateSendAsset: (asset: Asset, propagateChanges: boolean) => void;
}

// TODO: return validity
export const AddressInput: React.FC<AddressInputProps> = ({
  addBottomMargin = true,
  labelWidth,
  updateSendAsset,
}) => {
  const [address, setAddress] = useAtom(recipientAddressAtom);
  const setAddressVerified = useSetAtom(addressVerifiedAtom);
  const walletState = useAtomValue(walletStateAtom);

  const [addressStatus, setAddressStatus] = useState<'error' | 'success' | null>(null);
  const [allowValidateAddress, setAllowValidatePassword] = useState(false);

  const validAddressLength = 47;

  // TODO: allow validation against more than just Symphony addresses.  any address in registry.  provide warning and return error if not sendable?
  const validateAddress = () => {
    if (address === '') {
      setAddressStatus(null);
      return;
    }

    const hasPrefix = address.startsWith(WALLET_PREFIX);
    const isValidLength = address.length === validAddressLength;
    const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(address);

    const isAddressValid = hasPrefix && isValidLength && isAlphanumeric;
    setAddressStatus(isAddressValid ? 'success' : 'error');
    setAddressVerified(isAddressValid);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAddress = e.target.value;
    setAddress(newAddress);

    if (newAddress.length >= validAddressLength && !allowValidateAddress) {
      setAllowValidatePassword(true);
    }

    // Reset validation when empty
    if (newAddress === '') {
      setAllowValidatePassword(false);
      setAddressStatus(null);
    }

    if (allowValidateAddress) {
      validateAddress();
    }
  };

  const handleAddressBlur = () => {
    if (address.length > 0) {
      setAllowValidatePassword(true);
    }
    validateAddress();
  };

  const handleAddressPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    setAddress(pastedText);

    // Start validating immediately after paste
    if (pastedText.length > 0) {
      setAllowValidatePassword(true);
    }
    validateAddress();
  };

  useEffect(() => {
    validateAddress();
  }, [address]);

  useEffect(() => {
    setAddressVerified(addressStatus === 'success');
  }, [addressStatus]);

  return (
    <div className={cn(`flex items-baseline ${addBottomMargin ? 'mb-4' : ''} space-x-2`)}>
      <label className={cn(`text-sm text-neutral-1 whitespace-nowrap ${labelWidth}`)}>
        Send to:
      </label>
      <div className="flex-grow">
        <Input
          variant="primary"
          type="text"
          status={addressStatus}
          showMessageText={true}
          messageText={addressStatus === 'error' ? 'Address not in supported format' : ''}
          placeholder={walletState.address || 'Wallet Address or ICNS'}
          icon={<QRCodeScannerDialog updateSendAsset={updateSendAsset} />}
          value={address}
          onChange={handleAddressChange}
          onBlur={handleAddressBlur}
          onPaste={handleAddressPaste}
          className="text-white w-full"
        />
      </div>
    </div>
  );
};
