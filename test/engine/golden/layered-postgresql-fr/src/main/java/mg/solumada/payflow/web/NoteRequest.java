package mg.solumada.payflow.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO d'entrée : record dans `web` (LAY-007), contraintes Bean Validation ici et non dans le service (CORE-013).
 */
public record NoteRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 2000) String content) {}
