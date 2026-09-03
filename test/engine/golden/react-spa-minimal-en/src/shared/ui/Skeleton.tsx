// CORE-010: the loading state has a shape, sized like the content it stands for.
import { cn } from '@shared/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-border', className)}
    />
  );
}
