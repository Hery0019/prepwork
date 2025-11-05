package com.example.inventory.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.example.inventory.domain.Note;
import com.example.inventory.domain.NoteNotFoundException;
import com.example.inventory.repository.NoteRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit level (CORE-020, CORE-024): no Spring context, the repository is a mock. Naming `method_condition_expectedResult` (CORE-022).
 */
@ExtendWith(MockitoExtension.class)
class NoteServiceTest {

    @Mock
    private NoteRepository repository;

    @InjectMocks
    private NoteService service;

    @Test
    void create_validInput_savesNoteWithCreationDate() {
        when(repository.save(any(Note.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Note note = service.create("First", "Hello");

        assertThat(note.getTitle()).isEqualTo("First");
        assertThat(note.getContent()).isEqualTo("Hello");
        assertThat(note.getCreatedAt()).isNotNull();
    }

    @Test
    void get_unknownId_throwsNoteNotFound() {
        when(repository.findById(42L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(42L))
                .isInstanceOf(NoteNotFoundException.class)
                .hasMessageContaining("42");
    }
}
