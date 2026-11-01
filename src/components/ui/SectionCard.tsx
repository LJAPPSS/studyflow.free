import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { navigate } from '@/lib/router';

type SectionCardProps = {
  title: string;
  action?: { label: string; path: string };
  children: ReactNode;
  className?: string;
};

export function SectionCard({ title, action, children, className }: SectionCardProps) {
  return (
    <section className={cn('card', className)}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
        {action && (
          <button
            type="button"
            onClick={() => navigate(action.path)}
            className="group inline-flex items-center gap-1 rounded-lg text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
          >
            {action.label}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
