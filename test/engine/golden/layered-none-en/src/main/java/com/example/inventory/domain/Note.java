package com.example.inventory.domain;

import java.time.Instant;

/**
 * Reference example: a text note. Domain object without persistence; the identifier is assigned by the repository.
 */
public class Note {

    private Long id;
    private final String title;
    private final String content;
    private final Instant createdAt;

    public Note(String title, String content) {
        this.title = title;
        this.content = content;
        this.createdAt = Instant.now();
    }

    /** Called once, by the repository, on first save. */
    public void assignId(Long id) {
        if (this.id != null) {
            throw new IllegalStateException("Note %d already has an id".formatted(this.id));
        }
        this.id = id;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getContent() {
        return content;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
