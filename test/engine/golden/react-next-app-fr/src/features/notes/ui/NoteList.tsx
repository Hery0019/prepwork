// Composant de présentation : il reçoit ses notes en props (NEXT-001, NEXT-003).
import Link from 'next/link';
import { NoteCard, type Note } from '@entities/note';
import { t } from '@shared/lib/text';
import { Alert, Button } from '@shared/ui';

export function NoteList({ notes }: { notes: Note[] }) {
  if (notes.length === 0) {
    return (
      <Alert title={t('notes.empty.title', 'Aucune note pour le moment.')}>
        <Link href="/notes/new">
          <Button size="sm">
            {t('notes.empty.action', 'Créer la première')}
          </Button>
        </Link>
      </Alert>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {notes.map((note) => (
        <li key={note.id}>
          <NoteCard
            note={note}
            action={
              <Link href={`/notes/${note.id}`} className="text-primary underline">
                {t('notes.list.open', 'Ouvrir')}
              </Link>
            }
          />
        </li>
      ))}
    </ul>
  );
}
