package mg.solumada.payflow.common;

/**
 * Conflit avec l'état courant (doublon, version obsolète) : traduit en 409 par ApiExceptionHandler.
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
