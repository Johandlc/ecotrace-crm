package edu.uio.ecotrace.hallazgo.mapper;

import edu.uio.ecotrace.hallazgo.dto.HallazgoDto;
import edu.uio.ecotrace.hallazgo.model.Hallazgo;
import edu.uio.ecotrace.shared.util.Tiempo;
import org.springframework.stereotype.Component;

/**
 * Convierte entre la entidad y el DTO de los hallazgos (no conformidades).
 * SOLID (S): un único lugar decide qué campos salen por HTTP y cómo se aplican los cambios parciales (PATCH: los campos nulos no se tocan).
 */
@Component
public class HallazgoMapper {

    public HallazgoDto toDto(Hallazgo e) {
        return new HallazgoDto(e.getId(), e.getTitulo(), e.getSeveridad(), e.getEstado(), e.getOrigen(), e.getPuntoId(),
                e.getParametro(), Tiempo.aMillis(e.getFechaLimite()), e.getResponsable(), Tiempo.aMillis(e.getCreadoEn()));
    }

    public void aplicar(HallazgoDto d, Hallazgo e) {
        if (d.title() != null) e.setTitulo(d.title());
        if (d.severity() != null) e.setSeveridad(d.severity());
        if (d.status() != null) e.setEstado(d.status());
        if (d.origin() != null) e.setOrigen(d.origin());
        if (d.pointId() != null) e.setPuntoId(d.pointId());
        if (d.param() != null) e.setParametro(d.param());
        if (d.due() != null) e.setFechaLimite(Tiempo.desdeMillis(d.due()));
        if (d.owner() != null) e.setResponsable(d.owner());
    }
}
