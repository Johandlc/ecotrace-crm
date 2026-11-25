package edu.uio.ecotrace.cumplimiento.requisito.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.util.List;

/**
 * DTO de los requisitos de cumplimiento (permisos y normas): contrato JSON con el frontend.
 * Se separa de la entidad para que la API no quede atada al modelo de persistencia; las anotaciones de Bean Validation se verifican con @Valid en el controlador.
 */
public record RequisitoDto(
        String id,
        @NotBlank String title,
        @NotBlank @Pattern(regexp = "permiso|norma") String kind,
        String authorityId,
        Long expires,
        String status,
        List<String> pointIds,
        String obligations) {
}
