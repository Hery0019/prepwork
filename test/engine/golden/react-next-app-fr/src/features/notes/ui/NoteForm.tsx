'use client';

// NEXT-001 : le formulaire est le seul composant client de la feature, parce qu'il a un état.
// CORE-052 et CORE-053 : message relié au champ, envoi désactivé pendant la soumission.
import { useActionState } from 'react';
import { t } from '@shared/lib/text';
import { Alert, Button, Input } from '@shared/ui';
import { createNoteAction, type NoteFormState } from '../api/actions';

const EMPTY: NoteFormState = {};

export function NoteForm() {
  const [state, formAction, isPending] = useActionState(createNoteAction, EMPTY);

  return (
    <form action={formAction} className="flex max-w-measure flex-col gap-4" noValidate>
      <Input
        name="title"
        label={t('notes.form.title', 'Titre')}
        error={state.errors?.title}
      />
      <Input
        name="body"
        label={t('notes.form.body', 'Contenu')}
        error={state.errors?.body}
      />
      {state.message !== undefined && <Alert tone="error" title={state.message} />}
      <Button type="submit" disabled={isPending}>
        {t('notes.form.submit', 'Créer la note')}
      </Button>
    </form>
  );
}
