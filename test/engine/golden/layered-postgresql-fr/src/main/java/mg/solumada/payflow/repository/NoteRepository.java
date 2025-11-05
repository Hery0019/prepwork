package mg.solumada.payflow.repository;

import mg.solumada.payflow.domain.Note;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Accès aux notes : interface Spring Data, aucune logique métier (LAY-004).
 */
public interface NoteRepository extends JpaRepository<Note, Long> {}
