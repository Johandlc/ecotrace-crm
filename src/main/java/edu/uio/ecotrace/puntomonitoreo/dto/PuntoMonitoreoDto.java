package edu.uio.ecotrace.puntomonitoreo.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * DTO de los puntos de monitoreo (estaciones REMMAQ y puntos propios): contrato JSON con el frontend.
 * Se separa de la entidad para que la API no quede atada al modelo de persistencia; las anotaciones de Bean Validation se verifican con @Valid en el controlador.
 */
public record PuntoMonitoreoDto(
        String id,
        @NotBlank String name,
        @NotBlank @Pattern(regexp = "aire|agua|ruido") String type,
        String site,
        String zoneId,
        @NotNull @DecimalMin("-90") @DecimalMax("90") Double lat,
        @NotNull @DecimalMin("-180") @DecimalMax("180") Double lon) {
}
