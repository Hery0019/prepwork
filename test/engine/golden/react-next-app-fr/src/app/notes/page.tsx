// NEXT-003 : la lecture se fait ici, sur le serveur, puis la donnée descend en props.
import { listNotes } from '@features/notes';
import { NoteList } from '@features/notes';

// NEXT-013 : la page lit des données vivantes, donc elle est rendue à la demande.
export const dynamic = 'force-dynamic';

export default async function NotesPage() {
  const page = await listNotes(0);
  return <NoteList notes={page.content} />;
}
