package org.acme.shop.repository;

import static org.assertj.core.api.Assertions.assertThat;

import org.acme.shop.TestcontainersConfiguration;
import org.acme.shop.domain.Note;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

/**
 * Slice level (CORE-020) on the real database through Testcontainers (CORE-021): migrations run before the test.
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
