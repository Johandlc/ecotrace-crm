package edu.uio.ecotrace.integracion.externa.openmeteo.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/** Serie horaria de Open-Meteo para una coordenada. valores: variable → lista alineada con tiempos (puede contener null). */
public record SerieHoraria(Coordenada coordenada, List<Instant> tiempos, Map<String, List<Double>> valores, Map<String, String> unidades) {
}
