// CORE-010 : l'état de chargement a une forme, dimensionnée comme le contenu attendu.
import { cn } from '@shared/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-border', className)}
    />
  );
}
