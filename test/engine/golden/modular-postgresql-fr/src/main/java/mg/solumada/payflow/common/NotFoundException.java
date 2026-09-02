package mg.solumada.payflow.common;

/**
 * Ressource introuvable : traduite en 404 par ApiExceptionHandler. Les exceptions du domaine l'étendent.
 */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
