// L'entité `note` : sa forme, son schéma de validation et ce qu'on peut en dire sans réseau.
// CORE-041 : le schéma est la seule source du type ; personne ne réécrit l'interface à côté.
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
    .min(1, 'Le titre est obligatoire.')
    .max(120, '120 caractères au plus.'),
  body: z.string().trim().max(2000, '2000 caractères au plus.'),
});

export type NoteDraft = z.infer<typeof NoteDraftSchema>;

export const NotePageSchema = z.object({
  content: z.array(NoteSchema),
  page: z.number().int().nonnegative(),
  size: z.number().int().positive(),
  totalElements: z.number().int().nonnegative(),
});

export type NotePage = z.infer<typeof NotePageSchema>;

/** Extrait affichable d'une note, coupé sur un mot entier. Logique pure : testée sans React. */
export function noteExcerpt(note: Note, maxLength = 80): string {
  const body = note.body.trim();
  if (body.length <= maxLength) return body;
  const cut = body.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${lastSpace > 0 ? cut.slice(0, lastSpace) : cut}…`;
}
