package org.acme.shop;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

/**
 * Integration level (CORE-020): full context and real database through Testcontainers (CORE-021). Run by failsafe (`./mvnw verify`).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class NoteIT {

    @Autowired
    private MockMvcTester mvc;

    @Test
    void create_thenGet_roundTripsThroughTheApplication() {
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
