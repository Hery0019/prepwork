import 'server-only';

// NEXT-003 et NEXT-010 : ce module ne tourne que sur le serveur ; `server-only` le garantit
// à la compilation si un composant client l'importe par erreur.
import { NotePageSchema, NoteSchema, type Note, type NoteDraft, type NotePage } from '@entities/note';
import { request } from '@shared/api/httpClient';

const RESOURCE = '/notes';

export function listNotes(page: number): Promise<NotePage> {
  return request(`${RESOURCE}?page=${page}`, { schema: NotePageSchema });
}

export function getNote(id: string): Promise<Note> {
  return request(`${RESOURCE}/${id}`, { schema: NoteSchema });
}

export function createNote(draft: NoteDraft): Promise<Note> {
  return request(RESOURCE, { schema: NoteSchema, method: 'POST', body: draft });
}
