package com.example.inventory.common;

/**
 * Resource not found: translated to 404 by ApiExceptionHandler. Domain exceptions extend it.
 */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
