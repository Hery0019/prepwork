// Les paramètres de route sont attendus avant d'être lus (Next 15).
import { getNote, NoteDetail } from '@features/notes';

// NEXT-013 : la page lit des données vivantes, donc elle est rendue à la demande.
export const dynamic = 'force-dynamic';

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const note = await getNote(id);
  return <NoteDetail note={note} />;
}
