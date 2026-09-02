package com.example.inventory.web;

import com.example.inventory.common.PageResponse;
import com.example.inventory.domain.Note;
import com.example.inventory.service.NoteService;
import jakarta.validation.Valid;
import java.net.URI;
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
 * Thin controller (LAY-006): DTO validation, one service call, mapping to a response. Versioned URL (CORE-015), errors delegated to ApiExceptionHandler.
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
