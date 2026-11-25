package edu.uio.ecotrace.territorio.dto;

/**
 * Administración zonal del DMQ con su punto de referencia.
 */
public record ZonaDto(String id, String name, Double lat, Double lon, String description) {
}
