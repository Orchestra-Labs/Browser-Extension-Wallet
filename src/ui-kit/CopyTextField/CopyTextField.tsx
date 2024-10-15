import React, { useState } from 'react';
import { Copy, VerifySuccess } from '@/assets/icons';
import { Button } from '@/ui-kit';
import { ICON_CHANGEOVER_TIMEOUT } from '@/constants';

interface CopyTextFieldProps {
  variant?: 'transparent' | 'text';
  displayText: string;
  copyText?: string; // Optional prop for the text to copy
  iconHeight?: number; // Optional prop for the icon height
}

export const CopyTextField: React.FC<CopyTextFieldProps> = ({
  variant = 'transparent',
  displayText,
  copyText, // If not provided, defaults to `text`
  iconHeight = 20, // Default icon height is 14px
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyToClipboard = () => {
    // Use `copyText` if provided, otherwise use `displayText`
    navigator.clipboard.writeText(copyText || displayText);
    setCopied(true);
    // Reset after the icon changeover timeout
    setTimeout(() => setCopied(false), ICON_CHANGEOVER_TIMEOUT);
  };

  switch (variant) {
    case 'text': {
      return (
        <Button variant="transparent" size="small" onClick={handleCopyToClipboard}>
          <div className="flex items-center space-x-2">
            {copied ? (
              <VerifySuccess width={iconHeight} className="text-success animate-scale-up" />
            ) : (
              <Copy width={iconHeight} />
            )}
            <span className="ml-2.5 text-base">{displayText}</span>
          </div>
        </Button>
      );
    }
    default: {
      return (
        <Button
          variant="transparentNeutral"
          size="small"
          onClick={handleCopyToClipboard}
          className="mt-3"
        >
          <div className="flex items-center space-x-2 px-2 rounded-full border border-neutral-2">
            {copied ? (
              <VerifySuccess width={iconHeight} className="text-success animate-scale-up" />
            ) : (
              <Copy width={iconHeight} />
            )}
            <span className="text-sm ml-2.5">{displayText}</span>
          </div>
        </Button>
      );
    }
  }
};
