// SPA-009: the only place that names the notes endpoints and builds its cache keys.
import { NotePageSchema, NoteSchema, type Note, type NoteDraft, type NotePage } from '@entities/note';
import { request } from '@shared/api/httpClient';

const RESOURCE = '/notes';

export const notesKeys = {
  all: ['notes'] as const,
  page: (page: number) => ['notes', 'page', page] as const,
  detail: (id: string) => ['notes', 'detail', id] as const,
};

export function listNotes(page: number): Promise<NotePage> {
  return request(`${RESOURCE}?page=${page}`, { schema: NotePageSchema });
}

export function getNote(id: string): Promise<Note> {
  return request(`${RESOURCE}/${id}`, { schema: NoteSchema });
}

export function createNote(draft: NoteDraft): Promise<Note> {
  return request(RESOURCE, { schema: NoteSchema, method: 'POST', body: draft });
}
