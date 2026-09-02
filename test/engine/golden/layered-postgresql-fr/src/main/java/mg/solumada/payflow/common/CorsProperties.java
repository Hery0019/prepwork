package mg.solumada.payflow.common;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Origines autorisées, lues depuis `app.cors.allowed-origins` (variable APP_CORS_ALLOWED_ORIGINS).
 */
@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(List<String> allowedOrigins) {}
