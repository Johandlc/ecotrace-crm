package edu.uio.ecotrace.relaciones.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * DTO de las quejas y solicitudes de partes interesadas: contrato JSON con el frontend.
 * Se separa de la entidad para que la API no quede atada al modelo de persistencia; las anotaciones de Bean Validation se verifican con @Valid en el controlador.
 */
public record QuejaDto(
        String id,
        @NotBlank String stakeholderId,
        @NotBlank String subject,
        String channel,
        @Pattern(regexp = "abierta|en gestión|cerrada") String status,
        Long ts,
        String pointId) {
}
