package edu.uio.ecotrace.parteinteresada.mapper;

import edu.uio.ecotrace.parteinteresada.dto.ParteInteresadaDto;
import edu.uio.ecotrace.parteinteresada.model.ParteInteresada;
import org.springframework.stereotype.Component;

/**
 * Convierte entre la entidad y el DTO de las partes interesadas (autoridades, comunidad, laboratorios, auditores).
 * SOLID (S): un único lugar decide qué campos salen por HTTP y cómo se aplican los cambios parciales (PATCH: los campos nulos no se tocan).
 */
@Component
public class ParteInteresadaMapper {

    public ParteInteresadaDto toDto(ParteInteresada e) {
        return new ParteInteresadaDto(e.getId(), e.getNombre(), e.getTipo(), e.getContacto(), e.getInfluencia(), e.getPercepcion());
    }

    /** Copia sólo los campos no nulos (sirve para crear y para PATCH). */
    public void aplicar(ParteInteresadaDto d, ParteInteresada e) {
        if (d.name() != null) e.setNombre(d.name());
        if (d.type() != null) e.setTipo(d.type());
        if (d.contact() != null) e.setContacto(d.contact());
        if (d.influence() != null) e.setInfluencia(d.influence());
        if (d.sentiment() != null) e.setPercepcion(d.sentiment());
    }
}
