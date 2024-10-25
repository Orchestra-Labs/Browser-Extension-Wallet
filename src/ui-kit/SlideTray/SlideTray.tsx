import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as React from 'react';
import { cn } from '@/helpers/utils';
import { X } from '@/assets/icons';
import { Button } from '../Button';
import { Separator } from '../Separator';
import { useRef, useState } from 'react';
import { useGesture } from '@use-gesture/react';

interface SlideTrayProps {
  triggerComponent: React.ReactNode;
  title?: string;
  children: React.ReactNode;
  className?: string;
  closeButtonVariant?: 'top-right' | 'bottom-center';
  height?: string;
  showBottomBorder?: boolean;
  status?: 'error' | 'warn' | 'good';
  onClose?: () => void;
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
  onClose,
}) => {
  const trayRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  let titleColor = 'text-white';
  if (status === 'warn') {
    titleColor = 'text-warning';
  } else if (status === 'error') {
    titleColor = 'text-error';
  }

  const dismissThresholdPercentage = 0.3; // 30% of tray height

  const resetTrayPosition = () => {
    if (trayRef.current) {
      trayRef.current.style.transition = 'transform 0.3s ease';
      trayRef.current.style.transform = 'translateY(0px)';
    }
  };

  const dismissTray = () => {
    if (trayRef.current) {
      trayRef.current.style.transition = 'transform 0.3s ease';
      trayRef.current.style.transform = `translateY(${trayRef.current.clientHeight}px)`;
      setTimeout(() => {
        setOpen(false);
        onClose?.();
      }, 300);
    }
  };

  const calculateDismissThreshold = () => {
    if (trayRef.current) {
      return trayRef.current.clientHeight * dismissThresholdPercentage;
    }
    return 0;
  };

  // Gesture handling
  const bind = useGesture({
    onDrag: ({ movement: [, my], memo = trayRef.current?.getBoundingClientRect().top, event }) => {
      event.stopPropagation(); // Prevent event bubbling to outer elements

      if (!isDismissed && trayRef.current) {
        trayRef.current.style.transform = `translateY(${Math.max(0, my)}px)`;
        trayRef.current.style.transition = ''; // Disable animation while dragging
      }
      return memo;
    },
    onDragEnd: ({ movement: [, my] }) => {
      if (trayRef.current) {
        const threshold = calculateDismissThreshold();
        if (my > threshold) {
          // Dismiss the tray if the drag exceeds the threshold
          dismissTray();
        } else {
          // Reset to the original position if drag is below threshold
          resetTrayPosition();
        }
      }
      setIsDismissed(false);
    },
  });

  // TODO: darken SlideTray.
  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild onClick={() => setOpen(true)}>
        {triggerComponent}
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background-dialog-overlay" />
        <DialogPrimitive.Content
          ref={trayRef}
          {...bind()}
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50 w-full mx-auto p-6 bg-background-dialog-bg rounded-t-2xl flex flex-col',
            'data-[state=open]:animate-slide-in-from-bottom data-[state=closed]:animate-slide-out-to-bottom',
            className,
          )}
          style={{ height }}
        >
          <div className="relative flex flex-col h-full">
            {title && (
              <>
                <h2 className={`text-h5 font-bold ${titleColor} text-center mb-2`}>{title}</h2>
                <Separator variant="top" />
              </>
            )}
            <div className="flex-1 overflow-y-auto">{children}</div>
            {closeButtonVariant === 'top-right' && (
              <DialogPrimitive.Close className="absolute right-4 top-4 focus:outline-none">
                <X width={18} height={18} />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            )}
            {closeButtonVariant === 'bottom-center' && (
              <>
                <Separator variant="bottom" showBorder={showBottomBorder} />
                <div className="flex justify-center mt-1">
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
