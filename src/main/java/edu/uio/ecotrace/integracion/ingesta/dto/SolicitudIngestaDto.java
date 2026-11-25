package edu.uio.ecotrace.integracion.ingesta.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * Petición de ingesta: origen (interna/externa), canal y registros crudos. Bean Validation rechaza lotes vacíos o canales desconocidos.
 */
public record SolicitudIngestaDto(
        @NotBlank @Pattern(regexp = "interna|externa") String source,
        @NotBlank @Pattern(regexp = "sensor|formulario|laboratorio|api|demo|remmaq") String channel,
        @NotBlank String label,
        @NotEmpty @Size(max = 5000) List<RegistroEntradaDto> records) {
}
