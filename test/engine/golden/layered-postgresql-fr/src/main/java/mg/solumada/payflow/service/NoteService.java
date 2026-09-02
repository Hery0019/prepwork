package mg.solumada.payflow.service;

import mg.solumada.payflow.domain.Note;
import mg.solumada.payflow.domain.NoteNotFoundException;
import mg.solumada.payflow.repository.NoteRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Cas d'usage autour des notes. Le service est l'unité de travail (LAY-005) et renvoie des objets du domaine : la conversion en DTO se fait dans `web` (LAY-010).
 */
@Service
public class NoteService {

    private final NoteRepository repository;

    public NoteService(NoteRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public Note create(String title, String content) {
        return repository.save(new Note(title, content));
    }

    @Transactional(readOnly = true)
    public Note get(Long id) {
        return repository.findById(id).orElseThrow(() -> new NoteNotFoundException(id));
    }

    @Transactional(readOnly = true)
    public Page<Note> list(Pageable pageable) {
        return repository.findAll(pageable);
    }
}
