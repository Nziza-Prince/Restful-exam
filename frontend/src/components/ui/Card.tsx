import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function Card({ title, description, action, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900',
        className,
      )}
      {...props}
    >
      {(title || description || action) && (
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div>
            {title && (
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {title}
              </h3>
            )}
            {description && (
              <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

const accentBorders: Record<string, string> = {
  fire: 'border-l-fire-700',
  ember: 'border-l-red-500',
  amber: 'border-l-amber-500',
  slate: 'border-l-zinc-400',
  green: 'border-l-green-600',
  blue: 'border-l-blue-600',
};

const accentValues: Record<string, string> = {
  fire: 'text-fire-700 dark:text-fire-500',
  ember: 'text-red-600 dark:text-red-400',
  amber: 'text-amber-600 dark:text-amber-400',
  slate: 'text-zinc-600 dark:text-zinc-400',
  green: 'text-green-600 dark:text-green-400',
  blue: 'text-blue-600 dark:text-blue-400',
};

export function StatCard({
  label,
  value,
  accent = 'fire',
  sub,
}: {
  label: string;
  value: string | number;
  accent?: 'fire' | 'ember' | 'amber' | 'slate' | 'green' | 'blue';
  sub?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-200 border-l-4 bg-white px-5 py-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900',
        accentBorders[accent],
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className={cn('mt-2 font-mono text-3xl font-semibold', accentValues[accent])}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{sub}</p>}
    </div>
  );
}
