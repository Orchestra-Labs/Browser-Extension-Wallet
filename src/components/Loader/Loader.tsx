import { Spinner } from '@/assets/icons';
import { cn } from '@/helpers';

interface LoaderProps {
  isSpinning?: boolean;
  showBackground?: boolean;
  scaledHeight?: boolean;
}

export const Loader = ({
  isSpinning = true,
  showBackground = true,
  scaledHeight = false,
}: LoaderProps) => (
  <div
    className={cn(
      `${showBackground ? 'bg-background-dark-grey' : ''} ${scaledHeight ? 'mt-2 mb-[0.15rem]' : ''} w-full h-full flex items-center justify-center`,
    )}
  >
    <Spinner className={cn(`w-11 h-11 fill-blue ${isSpinning ? `animate-spin` : ''}`)} />
  </div>
);
