package org.acme.shop.common;

/**
 * Conflict with the current state (duplicate, stale version): translated to 409 by ApiExceptionHandler.
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
