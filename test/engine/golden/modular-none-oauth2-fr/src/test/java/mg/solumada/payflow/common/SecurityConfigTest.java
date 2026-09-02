package mg.solumada.payflow.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Vérifie les règles d'autorisation (SECO-001, SECO-004) sur un contrôleur sonde avec un JWT simulé ; aucun fournisseur d'identité n'est contacté.
 */
@WebMvcTest(
        controllers = SecurityConfigTest.ProbeController.class,
        properties = {"app.security.enabled=true", "spring.autoconfigure.exclude="})
@Import({SecurityConfig.class, SecurityConfigTest.ProbeController.class})
class SecurityConfigTest {

    @Autowired
    private MockMvcTester mvc;

    /** Remplace le décodeur qui irait chercher les clés de l'issuer. */
    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    void probe_withoutToken_returns401() {
        assertThat(mvc.get().uri("/api/v1/security-probe")).hasStatus(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void probe_withJwt_returns200() {
        assertThat(mvc.get().uri("/api/v1/security-probe").with(jwt())).hasStatusOk();
    }

    @Test
    void health_anonymous_isNotRejectedBySecurity() {
        int status = mvc.get().uri("/actuator/health").exchange().getResponse().getStatus();
        assertThat(status).isNotEqualTo(HttpStatus.UNAUTHORIZED.value());
    }

    @RestController
    @RequestMapping("/api/v1/security-probe")
    static class ProbeController {

        @GetMapping
        String probe() {
            return "ok";
        }
    }
}
