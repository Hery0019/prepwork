'use server';

// NEXT-004 : les écritures passent par une action serveur ; le client n'appelle jamais l'API.
// NEXT-005 : l'action revalide ce qu'elle invalide.
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { NoteDraftSchema } from '@entities/note';
import { createNote } from './notesApi';

export interface NoteFormState {
  errors?: { title?: string | undefined; body?: string | undefined } | undefined;
  message?: string | undefined;
}

export async function createNoteAction(
  _previous: NoteFormState,
  formData: FormData,
): Promise<NoteFormState> {
  const parsed = NoteDraftSchema.safeParse({
    title: formData.get('title'),
    body: formData.get('body'),
  });
  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    return { errors: { title: fields.title?.[0], body: fields.body?.[0] } };
  }

  let created;
  try {
    created = await createNote(parsed.data);
  } catch {
    return {
      message: 'La note n\'a pas pu être créée.',
    };
  }
  revalidatePath('/notes');
  redirect(`/notes/${created.id}`);
}
