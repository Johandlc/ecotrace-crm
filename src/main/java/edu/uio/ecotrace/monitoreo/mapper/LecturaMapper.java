package edu.uio.ecotrace.monitoreo.mapper;

import edu.uio.ecotrace.monitoreo.dto.LecturaDto;
import edu.uio.ecotrace.monitoreo.dto.ParametroDto;
import edu.uio.ecotrace.monitoreo.model.Lectura;
import edu.uio.ecotrace.shared.enums.Parametro;
import org.springframework.stereotype.Component;

/**
 * Convierte entre la entidad y el DTO de las lecturas validadas de monitoreo.
 * SOLID (S): un único lugar decide qué campos salen por HTTP y cómo se aplican los cambios parciales (PATCH: los campos nulos no se tocan).
 */
@Component
public class LecturaMapper {

    public LecturaDto toDto(Lectura l) {
        return new LecturaDto(l.getId(), l.getPuntoId(), l.getParametro(), l.getValor(), l.getFechaMedicion().toEpochMilli(),
                l.getFuente(), l.getCanal(), l.isExcede());
    }

    public ParametroDto toDto(Parametro p) {
        return new ParametroDto(p.codigo(), p.etiqueta(), p.unidad(), p.minimo(), p.maximo(), p.guiaOms(), p.promedioHoras(), p.medio().codigo(), p.norma());
    }
}
