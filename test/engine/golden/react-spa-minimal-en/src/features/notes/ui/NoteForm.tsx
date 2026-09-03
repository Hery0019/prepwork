// FNONE-001: without a library, each field is controlled and the form is validated
// by its schema on submit (CORE-050).
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { NoteDraftSchema } from '@entities/note';
import { t } from '@shared/lib/text';
import { Alert, Button, Input } from '@shared/ui';
import { useCreateNote } from '../model/useNotes';

export function NoteForm() {
  const navigate = useNavigate();
  const { mutateAsync, isPending, error } = useCreateNote();
  const [values, setValues] = useState({ title: '', body: '' });
  const [errors, setErrors] = useState<{ title?: string | undefined; body?: string | undefined }>(
    {},
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const parsed = NoteDraftSchema.safeParse(values);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({ title: flat.title?.[0], body: flat.body?.[0] });
      return;
    }
    setErrors({});
    const created = await mutateAsync(parsed.data);
    await navigate(`/notes/${created.id}`);
  };

  return (
    <form
      onSubmit={(event) => {
        void onSubmit(event);
      }}
      className="flex max-w-measure flex-col gap-4"
      noValidate
    >
      <Input
        label={t('notes.form.title', 'Title')}
        value={values.title}
        error={errors.title}
        onChange={(event) => {
          setValues((current) => ({ ...current, title: event.target.value }));
        }}
      />
      <Input
        label={t('notes.form.body', 'Body')}
        value={values.body}
        error={errors.body}
        onChange={(event) => {
          setValues((current) => ({ ...current, body: event.target.value }));
        }}
      />
      {error && (
        <Alert tone="error" title={t('notes.form.error', 'The note could not be created.')} />
      )}
      <Button type="submit" disabled={isPending}>
        {t('notes.form.submit', 'Create the note')}
      </Button>
    </form>
  );
}
