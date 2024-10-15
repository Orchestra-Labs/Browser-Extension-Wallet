import { ClassValue } from 'clsx';
import * as React from 'react';
import { ReactNode } from 'react';

import { cn } from '@/helpers/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'primary' | 'unstyled';
  label?: string;
  showsErrorText?: boolean;
  status?: 'error' | 'success' | null;
  errorText?: string;
  icon?: ReactNode;
  wrapperClass?: string;
  iconRole?: string;
  onIconClick?: () => void;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant,
      className,
      type,
      label,
      showsErrorText = false,
      status = null,
      errorText,
      icon,
      wrapperClass,
      iconRole,
      onIconClick,
      ...props
    },
    ref,
  ) => {
    const isError = status === 'error';
    const isSuccess = status === 'success';

    switch (variant) {
      case 'primary': {
        return (
          <div className={cn('text-left relative', wrapperClass as string)}>
            {label && <label className="block mb-1.5 text-xs text-white/80">{label}</label>}
            <input
              type={type}
              className={cn(
                'flex h-10 w-full rounded-md border border-neutral-3 bg-transparent px-2 py-1.5 text-base text-neutral-3',
                'hover:border-neutral-1 hover:text-neutral-1',
                'focus:outline-0 focus:border-blue focus:text-white',
                'placeholder:text-xs placeholder:text-neutral-3',
                isError &&
                  'border-error text-error hover:border-error hover:text-error focus:border-error focus:text-error',
                isSuccess &&
                  'border-success text-success hover:border-success hover:text-success focus:border-success focus:text-success',
                !!icon && 'pr-11.5',
                className as ClassValue,
              )}
              ref={ref}
              {...props}
            />
            {icon && (
              <div
                role={iconRole}
                className={cn(
                  `absolute ${label ? 'top-[27px]' : 'top-2'} right-3 w-6 h-6 flex items-center justify-center`,
                  'text-neutral-3 hover:text-neutral-1 focus:text-white',
                  isError && 'text-error hover:text-error focus:text-error',
                  isSuccess && 'text-success hover:text-success focus:text-success',
                )}
                onClick={onIconClick}
              >
                {icon}
              </div>
            )}
            {/* Ensure the span always has content, even if it's just a space */}
            {showsErrorText && (
              <span className="mt-1.5 text-sm text-error min-h-[20px] mb-4">
                {errorText || '\u00A0'}
              </span>
            )}
          </div>
        );
      }
      default: {
        return (
          <>
            <input className={cn('bg-transparent', className as string)} ref={ref} {...props} />
            {showsErrorText && <span className="mt-1.5 text-sm min-h-[20px] mb-4">&nbsp;</span>}
          </>
        );
      }
    }
  },
);

Input.displayName = 'Input';
