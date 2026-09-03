// SPA-005: the entity carries how a note is displayed, so two features show it the same way.
import { Card } from '@shared/ui';
import { noteExcerpt, type Note } from '../model/note';

export interface NoteCardProps {
  note: Note;
  /** Link rendering: the feature decides where to go, the entity knows nothing about routes. */
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
