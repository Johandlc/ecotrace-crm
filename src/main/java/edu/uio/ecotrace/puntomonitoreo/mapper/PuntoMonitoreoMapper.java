package edu.uio.ecotrace.puntomonitoreo.mapper;

import edu.uio.ecotrace.puntomonitoreo.dto.PuntoMonitoreoDto;
import edu.uio.ecotrace.puntomonitoreo.model.PuntoMonitoreo;
import org.springframework.stereotype.Component;

/**
 * Convierte entre la entidad y el DTO de los puntos de monitoreo (estaciones REMMAQ y puntos propios).
 * SOLID (S): un único lugar decide qué campos salen por HTTP y cómo se aplican los cambios parciales (PATCH: los campos nulos no se tocan).
 */
@Component
public class PuntoMonitoreoMapper {

    public PuntoMonitoreoDto toDto(PuntoMonitoreo e) {
        return new PuntoMonitoreoDto(e.getId(), e.getNombre(), e.getMedio(), e.getSitio(), e.getZonaId(), e.getLatitud(), e.getLongitud());
    }

    public void aplicar(PuntoMonitoreoDto d, PuntoMonitoreo e) {
        if (d.name() != null) e.setNombre(d.name());
        if (d.type() != null) e.setMedio(d.type());
        if (d.site() != null) e.setSitio(d.site());
        if (d.zoneId() != null) e.setZonaId(d.zoneId());
        if (d.lat() != null) e.setLatitud(d.lat());
        if (d.lon() != null) e.setLongitud(d.lon());
    }
}
