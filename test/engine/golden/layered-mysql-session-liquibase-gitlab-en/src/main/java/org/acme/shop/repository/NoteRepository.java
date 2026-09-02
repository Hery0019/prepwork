package org.acme.shop.repository;

import org.acme.shop.domain.Note;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Access to notes: Spring Data interface, no business logic (LAY-004).
 */
public interface NoteRepository extends JpaRepository<Note, Long> {}
