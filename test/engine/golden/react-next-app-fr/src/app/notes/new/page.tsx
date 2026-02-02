// La page ne fait que composer : le formulaire et son action vivent dans la feature.
import { NoteForm } from '@features/notes';

export default function NewNotePage() {
  return <NoteForm />;
}
