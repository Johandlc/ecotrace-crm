package edu.uio.ecotrace.integracion.ingesta.dto;

import java.util.List;

/**
 * Resumen de un lote procesado: recibidos, aceptados, duplicados (omitidos), rechazados con su motivo y excedencias.
 */
public record LoteIngestaDto(String id, Long ts, String source, String channel, String label, int received, int accepted,
                             int rejected, int duplicates, int exceedances, int findings, List<ErrorDto> errors) {

    public record ErrorDto(int row, String reason) {
    }
}
