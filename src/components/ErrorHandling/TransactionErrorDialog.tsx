import { useAtom } from 'jotai';
import { SlideTray, Button } from '@/ui-kit';
import { AlertCircle } from 'lucide-react';
import { errorAtom, errorDialogAtom } from '@/atoms';

export const TransactionErrorDialog: React.FC = () => {
  const [error, setError] = useAtom(errorAtom);
  const [isOpen, setIsOpen] = useAtom(errorDialogAtom);

  const handleClose = () => {
    setIsOpen(false);
    setError({ type: null, message: '' });
  };

  return (
    <SlideTray
      triggerComponent={<div />} // Empty div as we control opening via state
      onClose={handleClose}
      title="Transaction Failed"
      status="error"
      showBottomBorder
    >
      <div className="flex flex-col space-y-4 p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-neutral-1">{error.message}</p>
            {error.details && (
              <p className="text-xs text-neutral-2 font-mono mt-2">{error.details}</p>
            )}
          </div>
        </div>
        
        <Button 
          className="w-full mt-4" 
          onClick={handleClose}
        >
          Dismiss
        </Button>
      </div>
    </SlideTray>
  );
};