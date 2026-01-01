// CORE-010 : les trois états d'une liste sont écrits, jamais implicites.
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
        aria-label={t('notes.loading', 'Chargement des notes')}
      >
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert tone="error" title={t('notes.error.title', 'Les notes n\'ont pas pu être chargées.')}>
        {t('notes.error.hint', 'Réessayer dans un instant, ou prévenir l\'équipe si cela persiste.')}
      </Alert>
    );
  }

  if (data.content.length === 0) {
    return (
      <Alert title={t('notes.empty.title', 'Aucune note pour le moment.')}>
        <Link to="/notes/new">
          <Button size="sm">{t('notes.empty.action', 'Créer la première')}</Button>
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
                {t('notes.list.open', 'Ouvrir')}
              </Link>
            }
          />
        </li>
      ))}
    </ul>
  );
}
