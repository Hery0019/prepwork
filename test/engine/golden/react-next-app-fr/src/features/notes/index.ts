// NEXT-007 : la surface publique de la feature. Les pages n'importent que ça.
export { getNote, listNotes } from './api/notesApi';
export { createNoteAction, type NoteFormState } from './api/actions';
export { NoteDetail } from './ui/NoteDetail';
export { NoteForm } from './ui/NoteForm';
export { NoteList } from './ui/NoteList';
