package mg.solumada.payflow.web;

import java.time.Instant;
import mg.solumada.payflow.domain.Note;

/**
 * DTO de sortie : liste exactement les champs exposés ; l'entité n'est jamais renvoyée (CORE-012).
 */
public record NoteResponse(Long id, String title, String content, Instant createdAt) {

    public static NoteResponse from(Note note) {
        return new NoteResponse(note.getId(), note.getTitle(), note.getContent(), note.getCreatedAt());
    }
}
