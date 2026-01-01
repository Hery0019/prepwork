// FRM-001 : le formulaire est enregistré auprès de react-hook-form et validé par le schéma
// partagé de l'entité (CORE-050).
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { NoteDraftSchema, type NoteDraft } from '@entities/note';
import { t } from '@shared/lib/text';
import { Alert, Button, Input } from '@shared/ui';
import { useCreateNote } from '../model/useNotes';

export function NoteForm() {
  const navigate = useNavigate();
  const { mutateAsync, isPending, error } = useCreateNote();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NoteDraft>({ resolver: zodResolver(NoteDraftSchema), defaultValues: { title: '', body: '' } });

  const onSubmit = handleSubmit(async (draft) => {
    const created = await mutateAsync(draft);
    await navigate(`/notes/${created.id}`);
  });

  return (
    <form
      onSubmit={(event) => {
        void onSubmit(event);
      }}
      className="flex max-w-measure flex-col gap-4"
      noValidate
    >
      <Input
        label={t('notes.form.title', 'Titre')}
        error={errors.title?.message}
        {...register('title')}
      />
      <Input
        label={t('notes.form.body', 'Contenu')}
        error={errors.body?.message}
        {...register('body')}
      />
      {error && (
        <Alert tone="error" title={t('notes.form.error', 'La note n\'a pas pu être créée.')} />
      )}
      {/* CORE-053 : désactivé pendant l'envoi, réactivé en cas d'échec. */}
      <Button type="submit" disabled={isPending}>
        {t('notes.form.submit', 'Créer la note')}
      </Button>
    </form>
  );
}
