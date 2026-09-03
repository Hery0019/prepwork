// Content surface: one single way to lay out a block in the project.
import type { HTMLAttributes } from 'react';
import { cn } from '@shared/lib/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-md border border-border bg-surface p-4',
        className,
      )}
      {...props}
    />
  );
}
