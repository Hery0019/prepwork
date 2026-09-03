// SPA-003 : surface publique de l'entité. Tout le reste est interne.
export {
  NoteDraftSchema,
  NotePageSchema,
  NoteSchema,
  noteExcerpt,
  type Note,
  type NoteDraft,
  type NotePage,
} from './model/note';
export { NoteCard, type NoteCardProps } from './ui/NoteCard';
