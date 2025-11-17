package mg.solumada.payflow.note;

import mg.solumada.payflow.common.NotFoundException;

/**
 * Levée par la façade, traduite en 404 par ApiExceptionHandler : le contrôleur ne construit jamais de réponse d'erreur.
 */
public class NoteNotFoundException extends NotFoundException {

    public NoteNotFoundException(Long id) {
        super("Note %d not found".formatted(id));
    }
}
