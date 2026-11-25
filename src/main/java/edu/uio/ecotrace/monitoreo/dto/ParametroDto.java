package edu.uio.ecotrace.monitoreo.dto;

/**
 * Parámetro del catálogo con su límite legal (NCAA), guía OMS y período de promedio.
 */
public record ParametroDto(String code, String label, String unit, Double min, Double max, Double who, int avgHours, String medium, String norm) {
}
