import { Spinner } from '@/assets/icons';
import { cn } from '@/helpers';

interface LoaderProps {
  isSpinning?: boolean;
}

export const Loader = ({ isSpinning = false }: LoaderProps) => (
  <div className="bg-background-dark-grey w-full h-full flex items-center justify-center">
    <Spinner className={cn(`w-12 h-12 fill-blue ${isSpinning ? `animate-spin` : ''}`)} />
  </div>
);
