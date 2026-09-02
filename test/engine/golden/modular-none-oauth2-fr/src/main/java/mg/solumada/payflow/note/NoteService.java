package mg.solumada.payflow.note;

import mg.solumada.payflow.note.internal.Note;
import mg.solumada.payflow.note.internal.NoteRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

/**
 * Façade publique du module `note` (MOD-001) : unité de travail (MOD-008), renvoie des records publics (MOD-007) et publie les événements du module (MOD-005).
 */
@Service
public class NoteService {

    private final NoteRepository repository;
    private final ApplicationEventPublisher events;

    public NoteService(NoteRepository repository, ApplicationEventPublisher events) {
        this.repository = repository;
        this.events = events;
    }

    public NoteDetails create(String title, String content) {
        Note note = repository.save(new Note(title, content));
        events.publishEvent(new NoteCreated(note.getId(), note.getTitle()));
        return NoteDetails.from(note);
    }

    public NoteDetails get(Long id) {
        return repository.findById(id).map(NoteDetails::from).orElseThrow(() -> new NoteNotFoundException(id));
    }

    public Page<NoteDetails> list(Pageable pageable) {
        return repository.findAll(pageable).map(NoteDetails::from);
    }
}
