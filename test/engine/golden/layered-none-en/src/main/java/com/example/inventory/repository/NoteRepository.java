package com.example.inventory.repository;

import com.example.inventory.domain.Note;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Access to notes: same contract as Spring Data, without a database (LAY-004).
 */
public interface NoteRepository {

    Note save(Note note);

    Optional<Note> findById(Long id);

    Page<Note> findAll(Pageable pageable);
}
