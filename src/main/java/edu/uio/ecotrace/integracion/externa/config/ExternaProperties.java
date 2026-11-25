package edu.uio.ecotrace.integracion.externa.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Propiedades ecotrace.externa.* (URLs, API key de OpenAQ y timeout) leídas de application.properties.
 */
@ConfigurationProperties("ecotrace.externa")
public record ExternaProperties(OpenMeteo openMeteo, OpenAq openaq, int timeoutMs) {

    public record OpenMeteo(String baseUrl) {
    }

    public record OpenAq(String baseUrl, String apiKey) {
    }
}
