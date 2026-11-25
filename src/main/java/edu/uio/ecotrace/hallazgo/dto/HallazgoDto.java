package edu.uio.ecotrace.hallazgo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * DTO de los hallazgos (no conformidades): contrato JSON con el frontend.
 * Se separa de la entidad para que la API no quede atada al modelo de persistencia; las anotaciones de Bean Validation se verifican con @Valid en el controlador.
 */
public record HallazgoDto(
        String id,
        @NotBlank String title,
        @Pattern(regexp = "alta|media|baja") String severity,
        @Pattern(regexp = "abierto|en curso|cerrado") String status,
        String origin,
        String pointId,
        String param,
        Long due,
        String owner,
        Long createdAt) {
}
