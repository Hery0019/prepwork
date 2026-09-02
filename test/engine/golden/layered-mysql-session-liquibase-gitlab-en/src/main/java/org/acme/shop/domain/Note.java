package org.acme.shop.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * Reference example: a text note. JPA entity declared in `domain` (LAY-008), with no web or JSON annotation.
 */
@Entity
@Table(name = "note")
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 2000)
    private String content;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    /** Required by JPA. */
    protected Note() {}

    public Note(String title, String content) {
        this.title = title;
        this.content = content;
        this.createdAt = Instant.now();
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
