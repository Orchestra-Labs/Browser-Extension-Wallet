import React from 'react';
import { Button, Input, SlideTray } from '@/ui-kit';
import { TileScroller } from '../TileScroller';
import { SortDialog } from '../SortDialog';
import { useAtom } from 'jotai';
import { dialogSearchAtom } from '@/atoms';

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
  const [searchTerm, setSearchTerm] = useAtom(dialogSearchAtom);

  return (
    <SlideTray
      triggerComponent={
        <Button variant={buttonVariant} className="w-full">
          {buttonText}
        </Button>
      }
      title={isClaimDialog ? 'Claim' : 'Unstake'}
      showBottomBorder
    >
      <div className="flex flex-col h-full">
        {isClaimDialog && (
          <div className="flex justify-between space-x-4">
            <Button variant="secondary" className="w-full">
              To Wallet
            </Button>
            <Button className="w-full">To Restake</Button>
          </div>
        )}

        <div className="flex justify-between items-center px-2">
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
          <div className="flex-1 flex justify-end">
            <SortDialog isValidatorSort isDialog />
          </div>
        </div>

        {/* TODO: within tilescroller, ensure overflow over halfway results in ellipses.  they can click in for more information if needed */}
        <TileScroller
          activeIndex={1}
          isSelectable={true}
          addMargin={false}
          onSelectValidator={() => {}}
          isDialog={true}
        />

        <div className="mx-4 mt-2 mb-2">
          <Input
            type="text"
            variant="primary"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by validator name..."
          />
        </div>

        {!isClaimDialog && (
          <div className="flex justify-center space-x-4">
            <Button variant="secondary" className="mb-1 w-[44%]">
              Unstake
            </Button>
          </div>
        )}
      </div>
    </SlideTray>
  );
};
