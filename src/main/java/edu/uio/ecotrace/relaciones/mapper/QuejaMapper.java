package edu.uio.ecotrace.relaciones.mapper;

import edu.uio.ecotrace.relaciones.dto.QuejaDto;
import edu.uio.ecotrace.relaciones.model.Queja;
import edu.uio.ecotrace.shared.util.Tiempo;
import org.springframework.stereotype.Component;

/**
 * Convierte entre la entidad y el DTO de las quejas y solicitudes de partes interesadas.
 * SOLID (S): un único lugar decide qué campos salen por HTTP y cómo se aplican los cambios parciales (PATCH: los campos nulos no se tocan).
 */
@Component
public class QuejaMapper {

    public QuejaDto toDto(Queja e) {
        return new QuejaDto(e.getId(), e.getParteId(), e.getAsunto(), e.getCanal(), e.getEstado(), Tiempo.aMillis(e.getFecha()), e.getPuntoId());
    }

    public void aplicar(QuejaDto d, Queja e) {
        if (d.stakeholderId() != null) e.setParteId(d.stakeholderId());
        if (d.subject() != null) e.setAsunto(d.subject());
        if (d.channel() != null) e.setCanal(d.channel());
        if (d.status() != null) e.setEstado(d.status());
        if (d.ts() != null) e.setFecha(Tiempo.desdeMillis(d.ts()));
        if (d.pointId() != null) e.setPuntoId(d.pointId().isBlank() ? null : d.pointId());
    }
}
