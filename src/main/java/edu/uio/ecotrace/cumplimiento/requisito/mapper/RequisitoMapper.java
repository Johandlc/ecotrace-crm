package edu.uio.ecotrace.cumplimiento.requisito.mapper;

import edu.uio.ecotrace.cumplimiento.requisito.dto.RequisitoDto;
import edu.uio.ecotrace.cumplimiento.requisito.model.Requisito;
import edu.uio.ecotrace.cumplimiento.requisito.rules.EstadoRequisitoRule;
import edu.uio.ecotrace.shared.util.Tiempo;
import java.time.Instant;
import java.util.ArrayList;
import org.springframework.stereotype.Component;

/**
 * Convierte entre la entidad y el DTO de los requisitos de cumplimiento (permisos y normas).
 * SOLID (S): un único lugar decide qué campos salen por HTTP y cómo se aplican los cambios parciales (PATCH: los campos nulos no se tocan).
 */
@Component
public class RequisitoMapper {

    public RequisitoDto toDto(Requisito e) {
        return new RequisitoDto(e.getId(), e.getTitulo(), e.getTipo(), e.getAutoridadId(), Tiempo.aMillis(e.getVence()),
                EstadoRequisitoRule.calcular(e.getVence(), Instant.now()), new ArrayList<>(e.getPuntoIds()), e.getObligaciones());
    }

    public void aplicar(RequisitoDto d, Requisito e) {
        if (d.title() != null) e.setTitulo(d.title());
        if (d.kind() != null) e.setTipo(d.kind());
        if (d.authorityId() != null) e.setAutoridadId(d.authorityId().isBlank() ? null : d.authorityId());
        if (d.expires() != null) e.setVence(Tiempo.desdeMillis(d.expires()));
        if (d.obligations() != null) e.setObligaciones(d.obligations());
        if (d.pointIds() != null) {
            e.getPuntoIds().clear();
            e.getPuntoIds().addAll(d.pointIds());
        }
    }
}
