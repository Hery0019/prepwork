package mg.solumada.payflow;

import static org.assertj.core.api.Assertions.assertThat;

import mg.solumada.payflow.audit.AuditLog;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

/**
 * Niveau intégration (CORE-020) : contexte complet. Vérifie aussi que l'événement NoteCreated traverse la frontière de module (MOD-005).
 */
@SpringBootTest
@AutoConfigureMockMvc
class NoteIT {

    @Autowired
    private MockMvcTester mvc;

    @Autowired
    private AuditLog auditLog;

    @Test
    void create_thenGet_roundTripsAndNotifiesTheAuditModule() {
        long before = auditLog.createdNotes();
        MvcTestResult created = mvc.post()
                .uri("/api/v1/notes")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\": \"First\", \"content\": \"Hello\"}")
                .exchange();
        assertThat(created).hasStatus(HttpStatus.CREATED);

        String location = created.getResponse().getHeader("Location");
        assertThat(location).startsWith("/api/v1/notes/");
        assertThat(mvc.get().uri(location))
                .hasStatusOk()
                .bodyJson()
                .extractingPath("$.title")
                .isEqualTo("First");
        assertThat(auditLog.createdNotes()).isEqualTo(before + 1);
    }

    @Test
    void list_defaultPage_returnsPaginatedShape() {
        assertThat(mvc.get().uri("/api/v1/notes?page=0&size=5"))
                .hasStatusOk()
                .bodyJson()
                .extractingPath("$.size")
                .isEqualTo(5);
    }
}
