package edu.uio.ecotrace.evidencia.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * DTO de las evidencias documentales: contrato JSON con el frontend.
 * Se separa de la entidad para que la API no quede atada al modelo de persistencia; las anotaciones de Bean Validation se verifican con @Valid en el controlador.
 */
public record EvidenciaDto(
        String id,
        @NotBlank String name,
        @NotBlank @Pattern(regexp = "requirements|findings|complaints") String entity,
        @NotBlank String entityId,
        Long ts) {
}
