import { Input } from '@/ui-kit';
import { useAtom, useSetAtom } from 'jotai';
import { addressVerifiedAtom, recipientAddressAtom } from '@/atoms';
import { useEffect, useState } from 'react';
import { WALLET_PREFIX } from '@/constants';
import { cn } from '@/helpers';

interface AddressInputProps {
  addBottomMargin?: boolean;
}

export const AddressInput: React.FC<AddressInputProps> = ({ addBottomMargin = true }) => {
  const [address, setAddress] = useAtom(recipientAddressAtom);
  const setAddressVerified = useSetAtom(addressVerifiedAtom);

  const [addressStatus, setAddressStatus] = useState<'error' | 'success' | null>(null);
  const [allowValidateAddress, setAllowValidatePassword] = useState(false);

  const validAddressLength = 47;

  // Validate password
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
  };

  const checkAddressStatus = () => {
    if (allowValidateAddress || address.length === 0) {
      validateAddress();
    }
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
    <div className={cn(`flex items-baseline ${addBottomMargin ? 'mb-4' : ''} space-x-2`)}>
      <label className="text-sm text-neutral-1 whitespace-nowrap">Send to:</label>
      <div className="flex-grow">
        <Input
          variant="primary"
          type="text"
          status={addressStatus}
          showMessageText={true}
          messageText={addressStatus === 'error' ? 'Address not in supported format' : ''}
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
