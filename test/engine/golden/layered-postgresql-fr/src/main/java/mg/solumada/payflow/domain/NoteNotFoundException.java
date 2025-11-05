package mg.solumada.payflow.domain;

import mg.solumada.payflow.common.NotFoundException;

/**
 * Levée par le service, traduite en 404 par ApiExceptionHandler : le contrôleur ne construit jamais de réponse d'erreur.
 */
public class NoteNotFoundException extends NotFoundException {

    public NoteNotFoundException(Long id) {
        super("Note %d not found".formatted(id));
    }
}
