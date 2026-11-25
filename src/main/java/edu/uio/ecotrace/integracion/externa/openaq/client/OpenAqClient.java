package edu.uio.ecotrace.integracion.externa.openaq.client;

import tools.jackson.databind.JsonNode;
import edu.uio.ecotrace.integracion.externa.config.ExternaProperties;
import edu.uio.ecotrace.integracion.externa.openaq.dto.UbicacionOpenAqDto;
import edu.uio.ecotrace.shared.exception.IntegracionExternaException;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Cliente OpenAQ v3 (agregador de estaciones oficiales de calidad del aire). Requiere API key gratuita:
 * https://explore.openaq.org/register → variable de entorno OPENAQ_API_KEY.
 */
@Component
public class OpenAqClient {

    private final RestClient http;
    private final ExternaProperties props;

    public OpenAqClient(@Qualifier("openAqRestClient") RestClient http, ExternaProperties props) {
        this.http = http;
        this.props = props;
    }

    public boolean configurado() {
        return props.openaq().apiKey() != null && !props.openaq().apiKey().isBlank();
    }

    public List<UbicacionOpenAqDto> ubicacionesCercanas(double lat, double lon, int radioMetros) {
        if (!configurado()) throw new IntegracionExternaException("OpenAQ no está configurado: defina OPENAQ_API_KEY");
        try {
            JsonNode body = http.get()
                    .uri("/locations?coordinates={lat},{lon}&radius={r}&limit=100", lat, lon, Math.min(radioMetros, 25000))
                    .header("X-API-Key", props.openaq().apiKey())
                    .retrieve().body(JsonNode.class);
            List<UbicacionOpenAqDto> out = new ArrayList<>();
            if (body == null) return out;
            for (JsonNode n : body.path("results")) {
                List<String> params = new ArrayList<>();
                n.path("sensors").forEach(s -> params.add(s.path("parameter").path("name").asString()));
                out.add(new UbicacionOpenAqDto(n.path("id").asLong(), n.path("name").asString(),
                        n.path("coordinates").path("latitude").asDouble(), n.path("coordinates").path("longitude").asDouble(),
                        n.path("provider").path("name").asString(null), params));
            }
            return out;
        } catch (RestClientException e) {
            throw new IntegracionExternaException("No se pudo consultar OpenAQ: " + e.getMessage(), e);
        }
    }
}
