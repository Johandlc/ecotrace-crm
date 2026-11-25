package edu.uio.ecotrace.integracion.externa.openmeteo.client;

import tools.jackson.databind.JsonNode;
import edu.uio.ecotrace.integracion.externa.openmeteo.dto.Coordenada;
import edu.uio.ecotrace.integracion.externa.openmeteo.dto.SerieHoraria;
import edu.uio.ecotrace.integracion.externa.openmeteo.dto.ValoresActuales;
import edu.uio.ecotrace.shared.exception.IntegracionExternaException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Cliente de la Air Quality API de Open-Meteo (modelo CAMS de Copernicus). Sin API key; licencia CC BY 4.0.
 * Admite varias coordenadas en una sola petición (devuelve un arreglo).
 * Nota: la resolución global de CAMS es ~0.4° (~45 km), por lo que puntos cercanos de Quito comparten celda.
 */
@Component
public class OpenMeteoClient {

    private final RestClient http;

    public OpenMeteoClient(@Qualifier("openMeteoRestClient") RestClient http) {
        this.http = http;
    }

    public List<SerieHoraria> horario(List<Coordenada> coords, List<String> variables, int pastDays) {
        JsonNode root = get(coords, "hourly", variables, "&past_days=" + pastDays + "&forecast_days=1");
        List<SerieHoraria> out = new ArrayList<>();
        int i = 0;
        for (JsonNode n : iterable(root)) {
            JsonNode h = n.path("hourly");
            List<Instant> tiempos = new ArrayList<>();
            h.path("time").forEach(t -> tiempos.add(Instant.parse(t.asString() + ":00Z")));
            Map<String, List<Double>> valores = new LinkedHashMap<>();
            Map<String, String> unidades = new LinkedHashMap<>();
            for (String v : variables) {
                List<Double> serie = new ArrayList<>();
                h.path(v).forEach(x -> serie.add(x.isNull() ? null : x.asDouble()));
                valores.put(v, serie);
                unidades.put(v, n.path("hourly_units").path(v).asString());
            }
            out.add(new SerieHoraria(coords.get(Math.min(i++, coords.size() - 1)), tiempos, valores, unidades));
        }
        return out;
    }

    public List<ValoresActuales> actual(List<Coordenada> coords, List<String> variables) {
        JsonNode root = get(coords, "current", variables, "");
        List<ValoresActuales> out = new ArrayList<>();
        int i = 0;
        for (JsonNode n : iterable(root)) {
            JsonNode c = n.path("current");
            Map<String, Double> valores = new LinkedHashMap<>();
            for (String v : variables) valores.put(v, c.path(v).isNumber() ? c.path(v).asDouble() : null);
            out.add(new ValoresActuales(coords.get(Math.min(i++, coords.size() - 1)), Instant.parse(c.path("time").asString() + ":00Z"), valores));
        }
        return out;
    }

    private JsonNode get(List<Coordenada> coords, String modo, List<String> variables, String extra) {
        String lat = coords.stream().map(c -> String.valueOf(c.lat())).collect(Collectors.joining(","));
        String lon = coords.stream().map(c -> String.valueOf(c.lon())).collect(Collectors.joining(","));
        String uri = "?latitude=" + lat + "&longitude=" + lon + "&" + modo + "=" + String.join(",", variables) + "&timezone=GMT" + extra;
        try {
            JsonNode body = http.get().uri(uri).retrieve().body(JsonNode.class);
            if (body == null) throw new IntegracionExternaException("Open-Meteo devolvió una respuesta vacía");
            return body;
        } catch (RestClientException e) {
            throw new IntegracionExternaException("No se pudo consultar Open-Meteo: " + e.getMessage(), e);
        }
    }

    private static Iterable<JsonNode> iterable(JsonNode root) {
        return root.isArray() ? root : List.of(root);
    }
}
