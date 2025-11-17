package mg.solumada.payflow.note.internal;

import static org.assertj.core.api.Assertions.assertThat;

import mg.solumada.payflow.TestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

/**
 * Niveau slice (CORE-020) sur la vraie base via Testcontainers (CORE-021) : les migrations s'exécutent avant le test.
 */
@DataJpaTest
@Import(TestcontainersConfiguration.class)
class NoteRepositoryTest {

    @Autowired
    private NoteRepository repository;

    @Test
    void save_thenFindById_returnsPersistedNote() {
        Note saved = repository.save(new Note("First", "Hello"));

        assertThat(saved.getId()).isNotNull();
        assertThat(repository.findById(saved.getId()))
                .isPresent()
                .get()
                .extracting(Note::getTitle)
                .isEqualTo("First");
    }

    @Test
    void findAll_pageOfTwo_returnsRequestedPage() {
        repository.save(new Note("One", null));
        repository.save(new Note("Two", null));
        repository.save(new Note("Three", null));

        Page<Note> page = repository.findAll(PageRequest.of(0, 2));

        assertThat(page.getContent()).hasSize(2);
        assertThat(page.getTotalElements()).isEqualTo(3);
    }
}
