package mg.solumada.payflow.note;

import java.time.Instant;
import mg.solumada.payflow.note.internal.Note;

/**
 * Vue publique d'une note : ce que les autres modules et l'API HTTP voient (MOD-007), jamais l'entité (CORE-012).
 */
public record NoteDetails(Long id, String title, String content, Instant createdAt) {

    public static NoteDetails from(Note note) {
        return new NoteDetails(note.getId(), note.getTitle(), note.getContent(), note.getCreatedAt());
    }
}
