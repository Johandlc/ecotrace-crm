package edu.uio.ecotrace.evidencia.mapper;

import edu.uio.ecotrace.evidencia.dto.EvidenciaDto;
import edu.uio.ecotrace.evidencia.model.Evidencia;
import edu.uio.ecotrace.shared.util.Tiempo;
import org.springframework.stereotype.Component;

/**
 * Convierte entre la entidad y el DTO de las evidencias documentales.
 * SOLID (S): un único lugar decide qué campos salen por HTTP y cómo se aplican los cambios parciales (PATCH: los campos nulos no se tocan).
 */
@Component
public class EvidenciaMapper {

    public EvidenciaDto toDto(Evidencia e) {
        return new EvidenciaDto(e.getId(), e.getNombre(), e.getEntidad(), e.getEntidadId(), Tiempo.aMillis(e.getFecha()));
    }

    public void aplicar(EvidenciaDto d, Evidencia e) {
        if (d.name() != null) e.setNombre(d.name());
        if (d.entity() != null) e.setEntidad(d.entity());
        if (d.entityId() != null) e.setEntidadId(d.entityId());
        if (d.ts() != null) e.setFecha(Tiempo.desdeMillis(d.ts()));
    }
}
