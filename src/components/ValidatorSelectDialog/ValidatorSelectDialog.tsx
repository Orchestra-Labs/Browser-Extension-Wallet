import React from 'react';
import { Button, SlideTray } from '@/ui-kit';
import { TileScroller } from '../TileScroller';

interface ValidatorSelectDialogProps {
  buttonText: string;
  buttonVariant?: string;
  isClaimDialog?: boolean;
}

export const ValidatorSelectDialog: React.FC<ValidatorSelectDialogProps> = ({
  buttonText,
  buttonVariant,
  isClaimDialog = false,
}) => {
  return (
    <SlideTray
      triggerComponent={
        <Button variant={buttonVariant} className="w-full">
          {buttonText}
        </Button>
      }
      title={isClaimDialog ? 'Claim' : 'Unstake'}
    >
      <div className="flex flex-col items-center space-y-2">
        {/* Conditionally render buttons based on the dialog type */}
        {isClaimDialog ? (
          <div className="grid grid-cols-2 w-full gap-x-4 px-2">
            <Button className="w-full">To Wallet</Button>
            <Button className="w-full">To Restake</Button>
          </div>
        ) : (
          <Button className="w-full">Unstake</Button>
        )}

        <div className="relative w-full">
          {/* Flex container for the Select section */}
          <div className="flex justify-between items-center p-2">
            <div className="flex-1 text-sm">Tap to select</div>
            <div className="flex items-center">
              <p className="text-sm pr-1">Select:</p>
              <Button variant="selected" size="xsmall" className="px-1 rounded-md text-xs">
                All
              </Button>
              <p className="text-sm px-1">/</p>
              <Button variant="unselected" size="xsmall" className="px-1 rounded-md text-xs">
                None
              </Button>
            </div>
          </div>

          {/* TODO: reduce to 13 REM if bottom border goes back in, consider border-neutral-4 */}
          {/* QR Code Display */}
          <div className="flex-grow w-full max-h-[13.5rem] overflow-y-auto border border-gray-300 rounded-md">
            {/* TODO: within tilescroller, ensure overflow over halfway results in ellipses.  they can click in for more information if needed */}
            <TileScroller activeIndex={1} />
          </div>
        </div>
      </div>
    </SlideTray>
  );
};
