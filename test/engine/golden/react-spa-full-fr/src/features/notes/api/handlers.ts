// Réponses simulées de l'API des notes, utilisées par les tests de composants (CORE-062).
import { http, HttpResponse } from 'msw';
import type { Note } from '@entities/note';

const BASE = 'http://localhost:8080/api/v1';

export const aNote = (overrides: Partial<Note> = {}): Note => ({
  id: 'n-1',
  title: 'Première note',
  body: 'Un contenu court.',
  createdAt: '2026-01-01T10:00:00.000Z',
  ...overrides,
});

export const notesHandlers = {
  page: (notes: Note[]) =>
    http.get(`${BASE}/notes`, () =>
      HttpResponse.json({ content: notes, page: 0, size: 20, totalElements: notes.length }),
    ),
  failure: () => http.get(`${BASE}/notes`, () => new HttpResponse(null, { status: 500 })),
  detail: (note: Note) => http.get(`${BASE}/notes/${note.id}`, () => HttpResponse.json(note)),
};
