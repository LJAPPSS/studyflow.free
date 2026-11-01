import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type StatCardProps = {
  title: string;
  value: string;
  caption: string;
  tone: string;
  delay: number;
  children: ReactNode;
};

export function StatCard({ title, value, caption, tone, delay, children }: StatCardProps) {
  return (
    <div
      className={cn('animate-rise rounded-playful border-[3px] border-outline p-6 shadow-hard transition-[transform,box-shadow] duration-[180ms] ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg dark:bg-panel', tone)}
      style={{ animationDelay: `${delay}ms` } as CSSProperties}
    >
      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{title}</p>
      <p className="mt-2 text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">{value}</p>
      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{caption}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}
