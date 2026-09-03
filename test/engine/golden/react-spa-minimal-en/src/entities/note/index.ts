// SPA-003: public surface of the entity. Everything else is internal.
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
