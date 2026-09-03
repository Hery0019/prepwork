// CORE-010: the three states of a list are written down, never implicit.
import { Link } from 'react-router';
import { NoteCard } from '@entities/note';
import { t } from '@shared/lib/text';
import { Alert, Button, Skeleton } from '@shared/ui';
import { useNotes } from '../model/useNotes';

export function NoteList() {
  const { data, isPending, error } = useNotes();

  if (isPending) {
    return (
      <div
        className="flex flex-col gap-4"
        role="status"
        aria-busy="true"
        aria-label={t('notes.loading', 'Loading the notes')}
      >
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert tone="error" title={t('notes.error.title', 'The notes could not be loaded.')}>
        {t('notes.error.hint', 'Try again in a moment, or tell the team if it persists.')}
      </Alert>
    );
  }

  if (data.content.length === 0) {
    return (
      <Alert title={t('notes.empty.title', 'No notes yet.')}>
        <Link to="/notes/new">
          <Button size="sm">{t('notes.empty.action', 'Create the first one')}</Button>
        </Link>
      </Alert>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {data.content.map((note) => (
        <li key={note.id}>
          <NoteCard
            note={note}
            action={
              <Link to={`/notes/${note.id}`} className="text-primary underline">
                {t('notes.list.open', 'Open')}
              </Link>
            }
          />
        </li>
      ))}
    </ul>
  );
}
