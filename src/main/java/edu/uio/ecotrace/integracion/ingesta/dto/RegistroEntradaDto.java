package edu.uio.ecotrace.integracion.ingesta.dto;

/**
 * Registro crudo tal como llega de la fuente. value y ts son texto a propósito:
 * aceptan "7,1", 7.1, epoch millis o ISO-8601; la normalización ocurre en las reglas.
 */
public record RegistroEntradaDto(String pointId, String param, String value, String unit, String ts) {
}
