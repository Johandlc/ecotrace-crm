package edu.uio.ecotrace.integracion.externa.dto;

/**
 * Boletín de la autoridad ambiental (simulado: no existe una API pública oficial).
 */
public record BoletinDto(String title, String kind, String obligations, String origin) {
}
