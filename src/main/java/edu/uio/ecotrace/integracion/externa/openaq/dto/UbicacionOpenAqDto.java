package edu.uio.ecotrace.integracion.externa.openaq.dto;

import java.util.List;

/**
 * Estación de calidad del aire publicada por OpenAQ v3.
 */
public record UbicacionOpenAqDto(long id, String name, Double lat, Double lon, String provider, List<String> parameters) {
}
