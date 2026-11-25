package edu.uio.ecotrace.territorio.mapper;

import edu.uio.ecotrace.territorio.dto.FuenteEmisionDto;
import edu.uio.ecotrace.territorio.dto.ZonaDto;
import edu.uio.ecotrace.territorio.model.FuenteEmision;
import edu.uio.ecotrace.territorio.model.Zona;
import org.springframework.stereotype.Component;

/**
 * Convierte entre la entidad y el DTO de el territorio de Quito (zonas, fuentes de emisión y datasets reales).
 * SOLID (S): un único lugar decide qué campos salen por HTTP y cómo se aplican los cambios parciales (PATCH: los campos nulos no se tocan).
 */
@Component
public class TerritorioMapper {

    public ZonaDto toDto(Zona z) {
        return new ZonaDto(z.getId(), z.getNombre(), z.getLatitud(), z.getLongitud(), z.getDescripcion());
    }

    public FuenteEmisionDto toDto(FuenteEmision f) {
        return new FuenteEmisionDto(f.getId(), f.getNombre(), f.getSector(), f.getZonaId(), f.getParroquia(), f.getLatitud(), f.getLongitud(),
                f.getAnio(), f.getCo2e(), f.getCo2(), f.getCh4(), f.getPm25(), f.getNox(), f.getSo2(), f.getCo(),
                f.getDescripcion(), f.getTipoDato(), f.getReferencia(), f.getFuenteCoordenadas());
    }
}
