package com.example.inventory.web;

import com.example.inventory.domain.Note;
import java.time.Instant;

/**
 * Output DTO: lists exactly the exposed fields; the entity is never returned (CORE-012).
 */
public record NoteResponse(Long id, String title, String content, Instant createdAt) {

    public static NoteResponse from(Note note) {
        return new NoteResponse(note.getId(), note.getTitle(), note.getContent(), note.getCreatedAt());
    }
}
