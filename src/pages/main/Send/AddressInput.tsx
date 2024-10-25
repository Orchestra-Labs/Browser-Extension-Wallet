import { Input } from '@/ui-kit';
import { useAtom, useSetAtom } from 'jotai';
import { addressVerifiedAtom, recipientAddressAtom } from '@/atoms';
import { useEffect, useState } from 'react';
import { WALLET_PREFIX } from '@/constants';

interface AddressInputProps {}

export const AddressInput: React.FC<AddressInputProps> = ({}) => {
  const [address, setAddress] = useAtom(recipientAddressAtom);
  const setAddressVerified = useSetAtom(addressVerifiedAtom);

  const [addressStatus, setAddressStatus] = useState<'error' | 'success' | null>(null);
  const [allowValidateAddress, setAllowValidatePassword] = useState(false);

  // Validate password
  const validateAddress = () => {
    if (address === '') {
      setAddressStatus(null);
      return;
    }

    const addressLength = 47;
    const isAddressValid = address.startsWith(WALLET_PREFIX) && address.length === addressLength;
    setAddressStatus(isAddressValid ? 'success' : 'error');
  };

  const checkAddressStatus = () => {
    if (allowValidateAddress || address.length === 0) {
      validateAddress();
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setAddress(newPassword);

    // Start validating after 8 characters, paste, or blur
    if (newPassword.length >= 8 && !allowValidateAddress) {
      setAllowValidatePassword(true);
    }

    // Reset validation when empty
    if (newPassword === '') {
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

  // Validate address after the first validation
  useEffect(() => {
    checkAddressStatus();
  }, [address]);

  useEffect(() => {
    const addressVerified = addressStatus === 'success';

    setAddressVerified(addressVerified);
  }, [addressStatus]);

  useEffect(() => {
    setAddress(address);
  }, []);

  return (
    <div className="flex items-center mb-4 space-x-2">
      <label className="text-sm text-neutral-1 whitespace-nowrap">Send to:</label>
      <div className="flex-grow">
        <Input
          variant="primary"
          type="text"
          placeholder="Wallet Address or ICNS"
          // TODO: enable when QR code input is enabled
          // icon={
          //   <QRCode
          //     className="h-7 w-7 text-neutral-1 hover:bg-blue-hover hover:text-blue-dark cursor-pointer"
          //     width={20}
          //   />
          // }
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
