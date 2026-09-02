package mg.solumada.payflow.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.Optional;
import mg.solumada.payflow.domain.Note;
import mg.solumada.payflow.domain.NoteNotFoundException;
import mg.solumada.payflow.repository.NoteRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Niveau unitaire (CORE-020, CORE-024) : aucun contexte Spring, le repository est un mock. Nommage `method_condition_expectedResult` (CORE-022).
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
