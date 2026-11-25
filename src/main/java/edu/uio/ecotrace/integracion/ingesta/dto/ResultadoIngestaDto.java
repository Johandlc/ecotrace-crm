package edu.uio.ecotrace.integracion.ingesta.dto;

import edu.uio.ecotrace.hallazgo.dto.HallazgoDto;
import java.util.List;

/** Resultado plano del lote + hallazgos creados automáticamente. */
public record ResultadoIngestaDto(String id, Long ts, String source, String channel, String label, int received, int accepted,
                                  int rejected, int duplicates, int exceedances, int findings, List<LoteIngestaDto.ErrorDto> errors,
                                  List<HallazgoDto> created) {

    public static ResultadoIngestaDto de(LoteIngestaDto l, List<HallazgoDto> creados) {
        return new ResultadoIngestaDto(l.id(), l.ts(), l.source(), l.channel(), l.label(), l.received(), l.accepted(),
                l.rejected(), l.duplicates(), l.exceedances(), l.findings(), l.errors(), creados);
    }
}
