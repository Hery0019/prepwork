package mg.solumada.payflow.note.internal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO d'entrée, interne au module : contraintes Bean Validation ici et non dans la façade (CORE-013).
 */
public record NoteRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 2000) String content) {}
