package org.acme.shop.service;

import org.acme.shop.domain.Note;
import org.acme.shop.domain.NoteNotFoundException;
import org.acme.shop.repository.NoteRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Use cases around notes. The service is the unit of work (LAY-005) and returns domain objects: mapping to DTOs happens in `web` (LAY-010).
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
