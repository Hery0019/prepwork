package mg.solumada.payflow;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Base de données réelle pour les tests slice et d'intégration (CORE-021) : à importer avec @Import(TestcontainersConfiguration.class).
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestcontainersConfiguration {

    @Bean
    @ServiceConnection
    PostgreSQLContainer database() {
        return new PostgreSQLContainer("postgres:17-alpine");
    }
}
