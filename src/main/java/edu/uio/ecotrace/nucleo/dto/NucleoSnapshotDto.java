package edu.uio.ecotrace.nucleo.dto;

import edu.uio.ecotrace.cumplimiento.auditoria.dto.ActividadDto;
import edu.uio.ecotrace.cumplimiento.requisito.dto.RequisitoDto;
import edu.uio.ecotrace.evidencia.dto.EvidenciaDto;
import edu.uio.ecotrace.hallazgo.dto.HallazgoDto;
import edu.uio.ecotrace.integracion.ingesta.dto.LoteIngestaDto;
import edu.uio.ecotrace.monitoreo.dto.LecturaDto;
import edu.uio.ecotrace.parteinteresada.dto.ParteInteresadaDto;
import edu.uio.ecotrace.puntomonitoreo.dto.PuntoMonitoreoDto;
import edu.uio.ecotrace.relaciones.dto.QuejaDto;
import java.util.List;

/** Vista consolidada del núcleo de datos único (una sola llamada para hidratar el frontend). */
public record NucleoSnapshotDto(
        List<PuntoMonitoreoDto> points,
        List<LecturaDto> readings,
        List<ParteInteresadaDto> stakeholders,
        List<RequisitoDto> requirements,
        List<HallazgoDto> findings,
        List<QuejaDto> complaints,
        List<EvidenciaDto> evidence,
        List<LoteIngestaDto> ingestLog,
        List<ActividadDto> activity) {
}
