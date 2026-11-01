import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export const inputClass =
  'block w-full rounded-playful border-[3px] border-outline bg-panel px-4 py-3 text-sm text-ink placeholder:text-neutral-500 transition-[box-shadow,border-color,background-color] duration-[180ms] ease-out hover:bg-field-soft focus:border-accent-600 focus:bg-panel focus:shadow-[3px_3px_0_var(--dp-color-accent)] focus:outline-none disabled:opacity-60 dark:placeholder:text-neutral-400 dark:focus:border-accent-300 dark:focus:shadow-[3px_3px_0_#b294ff]';

type FieldProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string | null;
  className?: string;
  children: ReactNode;
};

export function Field({ label, htmlFor, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-semibold text-error-600 dark:text-error-300" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-neutral-600 dark:text-neutral-300">{hint}</p>
      ) : null}
    </div>
  );
}
