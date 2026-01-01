// The `note` entity: its shape, its validation schema and what can be said about it offline.
// CORE-041: the schema is the only source of the type; nobody rewrites the interface next to it.
import { z } from 'zod';

export const NoteSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  body: z.string(),
  createdAt: z.string().datetime(),
});

export type Note = z.infer<typeof NoteSchema>;

export const NoteDraftSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'The title is required.')
    .max(120, '120 characters at most.'),
  body: z.string().trim().max(2000, '2000 characters at most.'),
});

export type NoteDraft = z.infer<typeof NoteDraftSchema>;

export const NotePageSchema = z.object({
  content: z.array(NoteSchema),
  page: z.number().int().nonnegative(),
  size: z.number().int().positive(),
  totalElements: z.number().int().nonnegative(),
});

export type NotePage = z.infer<typeof NotePageSchema>;

/** Displayable excerpt of a note, cut on a word boundary. Pure logic: tested without React. */
export function noteExcerpt(note: Note, maxLength = 80): string {
  const body = note.body.trim();
  if (body.length <= maxLength) return body;
  const cut = body.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${lastSpace > 0 ? cut.slice(0, lastSpace) : cut}…`;
}
