import { Spinner } from '@/assets/icons';
import { cn } from '@/helpers';

export const Loader = ({ isSpinning = true }: { isSpinning?: boolean }) => (
  <div className="bg-background-dark-grey w-full h-full flex items-center justify-center">
    <Spinner className={cn(`w-12 h-12 ${isSpinning ? 'animate-spin' : ''} fill-blue`)} />
  </div>
);
