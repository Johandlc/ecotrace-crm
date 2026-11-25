package edu.uio.ecotrace.integracion.externa.openmeteo.dto;

import java.time.Instant;
import java.util.Map;

/**
 * Valores "current" de Open-Meteo para una coordenada.
 */
public record ValoresActuales(Coordenada coordenada, Instant tiempo, Map<String, Double> valores) {
}
