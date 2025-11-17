package mg.solumada.payflow.note;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import mg.solumada.payflow.note.internal.Note;
import mg.solumada.payflow.note.internal.NoteRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

/**
 * Niveau unitaire (CORE-020, CORE-024) : aucun contexte Spring ; repository et publication d'événements sont des mocks.
 */
@ExtendWith(MockitoExtension.class)
class NoteServiceTest {

    @Mock
    private NoteRepository repository;

    @Mock
    private ApplicationEventPublisher events;

    @InjectMocks
    private NoteService service;

    @Test
    void create_validInput_savesNoteAndPublishesNoteCreated() {
        when(repository.save(any(Note.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NoteDetails note = service.create("First", "Hello");

        assertThat(note.title()).isEqualTo("First");
        assertThat(note.createdAt()).isNotNull();
        verify(events).publishEvent(any(NoteCreated.class));
    }

    @Test
    void get_unknownId_throwsNoteNotFound() {
        when(repository.findById(42L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(42L))
                .isInstanceOf(NoteNotFoundException.class)
                .hasMessageContaining("42");
    }
}
