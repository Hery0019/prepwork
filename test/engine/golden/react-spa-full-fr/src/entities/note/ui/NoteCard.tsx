// SPA-005 : l'entité porte l'affichage d'une note, pour que deux features la montrent pareil.
import { Card } from '@shared/ui';
import { noteExcerpt, type Note } from '../model/note';

export interface NoteCardProps {
  note: Note;
  /** Rendu du lien : la feature décide où l'on va, l'entité ne connaît pas les routes. */
  action?: React.ReactNode;
}

export function NoteCard({ note, action }: NoteCardProps) {
  return (
    <Card className="flex flex-col gap-2">
      <h3 className="text-lg font-semibold">{note.title}</h3>
      <p className="text-muted">{noteExcerpt(note)}</p>
      {action}
    </Card>
  );
}
