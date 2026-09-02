package com.example.inventory.domain;

import com.example.inventory.common.NotFoundException;

/**
 * Thrown by the service, translated to 404 by ApiExceptionHandler: the controller never builds an error response.
 */
public class NoteNotFoundException extends NotFoundException {

    public NoteNotFoundException(Long id) {
        super("Note %d not found".formatted(id));
    }
}
