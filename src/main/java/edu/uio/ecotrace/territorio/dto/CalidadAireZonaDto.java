package edu.uio.ecotrace.territorio.dto;

import java.util.Map;

/** Calidad del aire actual (Open-Meteo/CAMS) en el punto de referencia de una zona. */
public record CalidadAireZonaDto(String zoneId, Long ts, Map<String, Double> values, String source) {
}
