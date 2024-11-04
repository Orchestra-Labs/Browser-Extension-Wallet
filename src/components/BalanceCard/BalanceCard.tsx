import { NavLink } from 'react-router-dom';
import { ReceiveDialog, ValidatorSelectDialog } from '@/components';
import { ROUTES } from '@/constants';
import { Button } from '@/ui-kit';

interface BalanceCardProps {
  title: string;
  primaryText: string;
  secondaryText?: string;
  currentStep: number;
  totalSteps: number;
}

export const BalanceCard = ({
  title,
  primaryText,
  secondaryText,
  currentStep,
  totalSteps,
}: BalanceCardProps) => {
  return (
    <div className="p-4 h-44 border rounded-xl border-neutral-4 flex flex-col items-center relative">
      <div className="text-center mb-4">
        <p className="text-base text-neutral-1 ">{title}</p>
        <h1 className="text-h2 text-white font-bold line-clamp-1">{primaryText}</h1>
        <p className="text-sm text-neutral-1 line-clamp-1">
          {secondaryText ? `Balance: ${secondaryText}` : <span>&nbsp;</span>}
        </p>
      </div>
      <div className="grid grid-cols-2 w-full gap-x-4 px-2">
        {currentStep === 0 && (
          <>
            <Button className={'w-full'} asChild>
              <NavLink to={ROUTES.APP.SEND}>Send</NavLink>
            </Button>
            <ReceiveDialog />
          </>
        )}
        {currentStep === 1 && (
          <>
            <ValidatorSelectDialog buttonText="Unstake" buttonVariant="secondary" />
            <ValidatorSelectDialog buttonText="Claim" isClaimDialog />
          </>
        )}
      </div>
      <div className="absolute bottom-2 flex space-x-2">
        {[...Array(totalSteps)].map((_, index) => (
          <span
            key={index}
            className={`w-2 h-2 rounded-full ${index === currentStep ? 'bg-blue' : 'bg-neutral-4'}`}
          />
        ))}
      </div>
    </div>
  );
};
