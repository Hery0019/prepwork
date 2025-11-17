package mg.solumada.payflow.note.internal;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Accès aux notes, interne au module (MOD-004) : même contrat que Spring Data, sans base de données.
 */
public interface NoteRepository {

    Note save(Note note);

    Optional<Note> findById(Long id);

    Page<Note> findAll(Pageable pageable);
}
