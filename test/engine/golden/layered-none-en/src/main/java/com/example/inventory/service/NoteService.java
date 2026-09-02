package com.example.inventory.service;

import com.example.inventory.domain.Note;
import com.example.inventory.domain.NoteNotFoundException;
import com.example.inventory.repository.NoteRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

/**
 * Use cases around notes. The service is the unit of work (LAY-005) and returns domain objects: mapping to DTOs happens in `web` (LAY-010).
 */
@Service
public class NoteService {

    private final NoteRepository repository;

    public NoteService(NoteRepository repository) {
        this.repository = repository;
    }

    public Note create(String title, String content) {
        return repository.save(new Note(title, content));
    }

    public Note get(Long id) {
        return repository.findById(id).orElseThrow(() -> new NoteNotFoundException(id));
    }

    public Page<Note> list(Pageable pageable) {
        return repository.findAll(pageable);
    }
}
