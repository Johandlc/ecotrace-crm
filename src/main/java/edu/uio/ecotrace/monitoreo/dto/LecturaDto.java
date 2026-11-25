package edu.uio.ecotrace.monitoreo.dto;

/**
 * DTO de las lecturas validadas de monitoreo: contrato JSON con el frontend.
 * Se separa de la entidad para que la API no quede atada al modelo de persistencia; las anotaciones de Bean Validation se verifican con @Valid en el controlador.
 */
public record LecturaDto(String id, String pointId, String param, Double value, Long ts, String source, String channel, boolean exceed) {
}
