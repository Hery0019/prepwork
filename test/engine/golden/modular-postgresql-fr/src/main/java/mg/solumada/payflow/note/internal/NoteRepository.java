package mg.solumada.payflow.note.internal;

import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Accès aux notes, interne au module (MOD-004) : interface Spring Data, aucune logique métier.
 */
public interface NoteRepository extends JpaRepository<Note, Long> {}
