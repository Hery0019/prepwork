package mg.solumada.payflow.note.internal;

import jakarta.validation.Valid;
import java.net.URI;
import mg.solumada.payflow.common.PageResponse;
import mg.solumada.payflow.note.NoteDetails;
import mg.solumada.payflow.note.NoteService;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Contrôleur interne au module (MOD-004) : validation du DTO, un appel de façade, records publics en réponse. URL versionnée (CORE-015), erreurs déléguées à ApiExceptionHandler.
 */
@RestController
@RequestMapping("/api/v1/notes")
public class NoteController {

    private final NoteService service;

    public NoteController(NoteService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<NoteDetails> create(@Valid @RequestBody NoteRequest request) {
        NoteDetails note = service.create(request.title(), request.content());
        return ResponseEntity.created(URI.create("/api/v1/notes/" + note.id())).body(note);
    }

    @GetMapping("/{id}")
    public NoteDetails get(@PathVariable Long id) {
        return service.get(id);
    }

    @GetMapping
    public PageResponse<NoteDetails> list(@PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.from(service.list(pageable));
    }
}
