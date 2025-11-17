package org.acme.shop.common;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Verifies the authorization rules (SECS-001, SECS-004) on a probe controller, with security explicitly re-enabled.
 */
@WebMvcTest(
        controllers = SecurityConfigTest.ProbeController.class,
        properties = {"app.security.enabled=true", "spring.autoconfigure.exclude="})
@Import({SecurityConfig.class, SecurityConfigTest.ProbeController.class})
class SecurityConfigTest {

    @Autowired
    private MockMvcTester mvc;

    @Test
    void probe_anonymous_returns401() {
        assertThat(mvc.get().uri("/api/v1/security-probe")).hasStatus(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @WithMockUser
    void probe_authenticated_returns200() {
        assertThat(mvc.get().uri("/api/v1/security-probe")).hasStatusOk();
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
