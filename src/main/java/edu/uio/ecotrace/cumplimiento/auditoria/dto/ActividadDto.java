package edu.uio.ecotrace.cumplimiento.auditoria.dto;

/**
 * DTO de la pista de auditoría (actividad): contrato JSON con el frontend.
 * Se separa de la entidad para que la API no quede atada al modelo de persistencia; las anotaciones de Bean Validation se verifican con @Valid en el controlador.
 */
public record ActividadDto(String id, Long ts, String text, String tone, String user) {
}
