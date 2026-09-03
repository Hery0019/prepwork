'use client';

// NEXT-011 : l'état d'erreur est un fichier client, seul endroit qui a besoin d'un état.
import { t } from '@shared/lib/text';
import { Alert, Button } from '@shared/ui';

export default function Error({ reset }: { error: globalThis.Error; reset: () => void }) {
  return (
    <Alert
      tone="error"
      title={t('notes.error.title', 'Les notes n\'ont pas pu être chargées.')}
    >
      <Button size="sm" onClick={reset}>
        {t('notes.error.retry', 'Réessayer')}
      </Button>
    </Alert>
  );
}
