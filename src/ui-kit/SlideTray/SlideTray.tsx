import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as React from 'react';
import { cn } from '@/helpers/utils';
import { X } from '@/assets/icons';
import { Button } from '../Button';

interface SlideTrayProps {
  triggerComponent: React.ReactNode;
  title?: string;
  children: React.ReactNode;
  className?: string;
  closeButtonVariant?: 'top-right' | 'bottom-center';
  height?: string;
  showBottomBorder?: boolean;
  status?: 'error' | 'warn' | 'good';
}

export const SlideTray: React.FC<SlideTrayProps> = ({
  triggerComponent,
  title,
  children,
  className,
  closeButtonVariant = 'bottom-center',
  height = '75%',
  showBottomBorder = false,
  status = 'good',
}) => {
  let titleColor = 'text-white';
  if (status === 'warn') {
    titleColor = 'text-warning';
  } else if (status === 'error') {
    titleColor = 'text-error';
  }

  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>{triggerComponent}</DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-background-dialog-overlay',
            'data-[state=open]:animate-fade-in-0 data-[state=closed]:animate-fade-out-0',
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50 w-full mx-auto p-6 bg-background-dialog-bg rounded-t-2xl',
            'data-[state=open]:animate-slide-in-from-bottom data-[state=closed]:animate-slide-out-to-bottom',
            className,
          )}
          style={{ height }}
        >
          <div className="relative">
            {title && (
              <>
                <h2 className={`text-h5 font-bold ${titleColor} text-center mb-2`}>{title}</h2>
                <div className="border-b border-neutral-4 mb-4" />
              </>
            )}

            <div className="mt-4 h-76 max-h-76 min-h-76 overflow-y-auto">{children}</div>

            {closeButtonVariant === 'top-right' && (
              <DialogPrimitive.Close className="absolute right-4 top-4 focus:outline-none">
                <X width={18} height={18} />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            )}
            {closeButtonVariant === 'bottom-center' && (
              <>
                <div
                  className={`border-b ${showBottomBorder ? 'border-neutral-4' : 'border-transparent'} mt-1 mb-2`}
                />
                <div className="absolute left-0 right-0 flex justify-center mt-1">
                  <DialogPrimitive.Close asChild>
                    <Button className="w-[56%] py-3 rounded-full text-lg">Close</Button>
                  </DialogPrimitive.Close>
                </div>
              </>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
