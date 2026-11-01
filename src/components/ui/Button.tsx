import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

const RAISED = 'border-[3px] border-outline shadow-hard-sm enabled:hover:-translate-x-0.5 enabled:hover:-translate-y-0.5 enabled:hover:shadow-hard enabled:active:translate-x-[3px] enabled:active:translate-y-[3px] enabled:active:shadow-none';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: cn(RAISED, 'bg-accent-600 text-white enabled:hover:bg-accent-500'),
  secondary: cn(RAISED, 'bg-panel text-ink enabled:hover:bg-selection'),
  danger: cn(RAISED, 'bg-error-600 text-white enabled:hover:bg-error-700'),
  ghost: 'text-ink enabled:hover:bg-selection enabled:active:scale-[0.97]',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-xl',
  md: 'h-11 px-5 text-sm gap-2 rounded-playful',
};

export function Button({ variant = 'primary', size = 'md', loading = false, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={cn(
        'group inline-flex items-center justify-center font-semibold whitespace-nowrap transition-[transform,box-shadow,background-color,color] duration-[180ms] ease-out disabled:cursor-not-allowed disabled:opacity-60 [&>svg]:transition-transform [&>svg]:duration-300 [&>svg]:ease-out enabled:hover:[&>svg]:scale-110 enabled:hover:[&>svg]:rotate-[-6deg]',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
