package edu.uio.ecotrace.parteinteresada.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** Contrato JSON compartido con el frontend (claves cortas en inglés). */
public record ParteInteresadaDto(
        String id,
        @NotBlank String name,
        @NotBlank @Pattern(regexp = "autoridad|comunidad|laboratorio|auditor|proveedor") String type,
        String contact,
        @Min(1) @Max(5) Integer influence,
        @Pattern(regexp = "positivo|neutral|negativo") String sentiment) {
}
