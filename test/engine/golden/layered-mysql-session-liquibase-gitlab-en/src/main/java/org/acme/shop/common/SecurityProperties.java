package org.acme.shop.common;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Security settings (`app.security`): switch and bootstrap administrator read from environment variables (SECS-002).
 */
@ConfigurationProperties(prefix = "app.security")
public record SecurityProperties(boolean enabled, Admin admin) {

    public record Admin(String username, String password) {}
}
