// QRY-001 : l'état serveur appartient à la bibliothèque de requêtes ; aucun `useState` ne le copie.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Note, NoteDraft, NotePage } from '@entities/note';
import { createNote, getNote, listNotes, notesKeys } from '../api/notesApi';

export function useNotes(page = 0) {
  return useQuery<NotePage>({
    queryKey: notesKeys.page(page),
    queryFn: () => listNotes(page),
  });
}

export function useNote(id: string) {
  return useQuery<Note>({
    queryKey: notesKeys.detail(id),
    queryFn: () => getNote(id),
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: NoteDraft) => createNote(draft),
    // QRY-003 : une mutation déclare ce qu'elle invalide, elle ne recharge pas à la main.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notesKeys.all }),
  });
}
