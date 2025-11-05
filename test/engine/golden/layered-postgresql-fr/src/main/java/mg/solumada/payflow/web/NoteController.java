package mg.solumada.payflow.web;

import jakarta.validation.Valid;
import java.net.URI;
import mg.solumada.payflow.common.PageResponse;
import mg.solumada.payflow.domain.Note;
import mg.solumada.payflow.service.NoteService;
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
 * Contrôleur fin (LAY-006) : validation du DTO, un appel de service, conversion en réponse. URL versionnée (CORE-015), erreurs déléguées à ApiExceptionHandler.
 */
@RestController
@RequestMapping("/api/v1/notes")
public class NoteController {

    private final NoteService service;

    public NoteController(NoteService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<NoteResponse> create(@Valid @RequestBody NoteRequest request) {
        Note note = service.create(request.title(), request.content());
        return ResponseEntity.created(URI.create("/api/v1/notes/" + note.getId()))
                .body(NoteResponse.from(note));
    }

    @GetMapping("/{id}")
    public NoteResponse get(@PathVariable Long id) {
        return NoteResponse.from(service.get(id));
    }

    @GetMapping
    public PageResponse<NoteResponse> list(@PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.from(service.list(pageable).map(NoteResponse::from));
    }
}
