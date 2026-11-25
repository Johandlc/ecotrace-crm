package edu.uio.ecotrace.integracion.externa.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/**
 * Crea los RestClient de Open-Meteo y OpenAQ con timeouts y User-Agent propios.
 * SOLID (S): la configuración HTTP vive aquí; los clientes sólo construyen peticiones y leen JSON.
 */
@Configuration
public class RestClientConfig {

    private SimpleClientHttpRequestFactory factory(ExternaProperties p) {
        SimpleClientHttpRequestFactory f = new SimpleClientHttpRequestFactory();
        f.setConnectTimeout(p.timeoutMs());
        f.setReadTimeout(p.timeoutMs());
        return f;
    }

    @Bean
    public RestClient openMeteoRestClient(ExternaProperties p) {
        return RestClient.builder().requestFactory(factory(p)).baseUrl(p.openMeteo().baseUrl())
                .defaultHeader("User-Agent", "EcoTrace-CRM/0.1").build();
    }

    @Bean
    public RestClient openAqRestClient(ExternaProperties p) {
        return RestClient.builder().requestFactory(factory(p)).baseUrl(p.openaq().baseUrl())
                .defaultHeader("User-Agent", "EcoTrace-CRM/0.1").build();
    }
}
