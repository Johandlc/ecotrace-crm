package edu.uio.ecotrace.reportes.dto;

import edu.uio.ecotrace.cumplimiento.requisito.dto.RequisitoDto;
import edu.uio.ecotrace.evidencia.dto.EvidenciaDto;
import edu.uio.ecotrace.hallazgo.dto.HallazgoDto;
import edu.uio.ecotrace.parteinteresada.dto.ParteInteresadaDto;
import java.util.List;

/**
 * Informe completo de un requisito para la autoridad: datos de monitoreo, hallazgos y evidencias.
 */
public record InformeCumplimientoDto(RequisitoDto requirement, ParteInteresadaDto authority, int hours, List<FilaReporteDto> rows,
                                     List<HallazgoDto> findings, List<EvidenciaDto> evidence, long generatedAt) {
}
