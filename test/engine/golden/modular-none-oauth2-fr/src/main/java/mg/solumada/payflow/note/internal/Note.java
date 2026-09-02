package mg.solumada.payflow.note.internal;

import java.time.Instant;

/**
 * Objet du module `note` sans persistance, interne au module (MOD-004) ; l'identifiant est attribué par le repository.
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

    /** Appelé une seule fois, par le repository, à la première sauvegarde. */
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
