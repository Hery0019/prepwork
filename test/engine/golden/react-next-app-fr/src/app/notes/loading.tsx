// NEXT-011 : l'état de chargement est un fichier, diffusé par le framework.
import { t } from '@shared/lib/text';
import { Skeleton } from '@shared/ui';

export default function Loading() {
  return (
    <div
      className="flex flex-col gap-4"
      role="status"
      aria-busy="true"
      aria-label={t('notes.loading', 'Chargement des notes')}
    >
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
    </div>
  );
}
