// Surface de contenu : une seule façon de poser un bloc dans le projet.
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
