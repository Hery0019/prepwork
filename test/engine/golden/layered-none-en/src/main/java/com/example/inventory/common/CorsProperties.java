package com.example.inventory.common;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Allowed origins, read from `app.cors.allowed-origins` (APP_CORS_ALLOWED_ORIGINS variable).
 */
@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(List<String> allowedOrigins) {}
