import { Input } from '@/ui-kit';
import { AssetSelectDialog } from '@/components';
import { cn } from '@/helpers/utils';
import { Asset } from '@/types';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { GREATER_EXPONENT_DEFAULT } from '@/constants';

interface AssetInputProps {
  isReceiveInput?: boolean;
  isDisabled?: boolean;
  currentState: {
    asset: Asset | null;
    amount: number;
  };
  placeholder: string;
  updateAsset: (newAsset: Asset, propagateChanges?: boolean) => void;
  updateAmount: (newReceiveAmount: number, propagateChanges?: boolean) => void;
}

export const AssetInput: React.FC<AssetInputProps> = ({
  isReceiveInput = false,
  isDisabled = false,
  currentState,
  placeholder = '',
  updateAsset,
  updateAmount,
}) => {
  const [localInputValue, setLocalInputValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const prevValueRef = useRef<string>('');
  const currentAsset = currentState.asset;
  const currentExponent = currentAsset?.exponent ?? GREATER_EXPONENT_DEFAULT;

  const onAmountValueChange = (value: number) => {
    const roundedValue = parseFloat(value.toFixed(currentExponent));
    updateAmount(roundedValue, true); // Propagate the change
  };

  // Effect to update local input value whenever the parent updates amountValue
  useEffect(() => {
    if (!isNaN(currentState.amount) && currentState.amount !== null && currentState.amount !== 0) {
      const formattedNumber = formatNumberWithCommas(currentState.amount || 0);
      setLocalInputValue(formattedNumber);
    } else {
      setLocalInputValue('');
    }
  }, [currentState.amount]);

  // Format the number with commas
  const formatNumberWithCommas = (value: string | number): string => {
    const stringValue = String(value);
    const [integerPart, decimalPart] = stringValue.split('.') || ['', ''];
    const formattedIntegerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const formattedNumber =
      decimalPart !== undefined ? `${formattedIntegerPart}.${decimalPart}` : formattedIntegerPart;

    return formattedNumber;
  };

  // Helper function to remove all non-numeric characters (except decimal points)
  const stripNonNumerics = (value: string) => {
    return value.replace(/[^\d.]/g, '');
  };

  // Validate numeric input and restrict to selectedAsset.exponent decimal places
  const getRegexForDecimals = (exponent: number) => {
    return new RegExp(`^\\d*\\.?\\d{0,${exponent}}$`);
  };

  // Handle user input change, strip non-numerics, add the new character, and reformat
  const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    const caretPosition = event.target.selectionStart || 0;
    const regex = getRegexForDecimals(currentExponent);

    // Remove commas and non-numeric characters for accurate processing
    const rawValue = stripNonNumerics(inputValue);

    // Split the input into the integer and decimal parts
    const [integerPart, decimalPart] = rawValue.split('.');

    // Check if decimal part exceeds 6 digits and truncate if necessary
    let processedValue = rawValue;
    if (decimalPart && decimalPart.length > currentExponent) {
      processedValue = `${integerPart}.${decimalPart.slice(0, currentExponent)}`;
    }

    const numericValue = parseFloat(processedValue);

    if (!isNaN(numericValue) || !regex.test(inputValue) || inputValue === '') {
      onAmountValueChange(numericValue);
    } else {
      onAmountValueChange(0);
    }

    // Update the input with the formatted value
    const formattedValue = formatNumberWithCommas(processedValue || 0);
    setLocalInputValue(formattedValue);

    const previousRawValue = stripNonNumerics(prevValueRef.current);
    const previousFormattedValue = formatNumberWithCommas(parseFloat(previousRawValue));

    // Reposition the caret
    setTimeout(() => {
      if (inputRef.current) {
        // Compare the previous value with the new one to determine if it's an addition or removal
        let characterWasAdded = false;
        if (rawValue.length > previousRawValue.length) {
          characterWasAdded = true;
        } else if (rawValue.length < previousRawValue.length) {
          characterWasAdded = false;
        } else {
          characterWasAdded = false;
        }

        let newCaretPosition = caretPosition;
        if (characterWasAdded) {
          if (formattedValue.length - rawValue.length > 1) {
            newCaretPosition += 1;
          } else if (
            rawValue.length > previousFormattedValue.length &&
            formattedValue.length !== rawValue.length
          ) {
            newCaretPosition += 1;
          }
        } else if (!characterWasAdded) {
          if (previousFormattedValue.length - formattedValue.length > 1) {
            newCaretPosition -= 1;
          } else if (formattedValue.length === previousRawValue.length) {
            // Do nothing
          }
        }

        prevValueRef.current = processedValue;

        // Ensure caret assignment happens after the DOM is updated
        setTimeout(() => {
          inputRef.current?.setSelectionRange(newCaretPosition, newCaretPosition);
        }, 0);
      }
    }, 0);
  };

  // Handle formatting the input when the user finishes typing (on blur)
  const handleBlur = () => {
    const value = parseFloat(stripNonNumerics(localInputValue));

    if (!isNaN(value)) {
      setLocalInputValue(formatNumberWithCommas(value));
    }
  };

  return (
    <div className="flex items-center mb-4 space-x-2">
      <label className="text-sm text-neutral-1 whitespace-nowrap">
        {isReceiveInput ? 'Receiving:' : 'Sending:'}
      </label>
      <div className="flex-grow">
        <Input
          variant="primary"
          type="text"
          ref={inputRef}
          placeholder={placeholder}
          step={currentExponent}
          value={localInputValue || ''}
          onChange={handleAmountChange}
          onBlur={handleBlur}
          // TODO: ensure onHover is removed and text colors are muted for disabled variant
          disabled={isDisabled}
          icon={
            <AssetSelectDialog
              selectedAsset={currentAsset}
              isSendDialog={false}
              onClick={updateAsset}
            />
          }
          className={cn('p-2.5 text-white border border-neutral-2 rounded-md w-full h-10')}
        />
      </div>
    </div>
  );
};
