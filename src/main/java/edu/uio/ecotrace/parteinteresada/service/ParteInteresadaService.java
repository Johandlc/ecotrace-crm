package edu.uio.ecotrace.parteinteresada.service;

import edu.uio.ecotrace.parteinteresada.dto.ParteInteresadaDto;
import java.util.List;

/**
 * Contrato de la lógica de negocio de las partes interesadas (autoridades, comunidad, laboratorios, auditores).
 *
 * Conexión: ParteInteresadaController (u otros servicios) dependen de esta interfaz; ParteInteresadaServiceImpl la implementa.
 *
 * SOLID:
 *  - D: quien la usa depende de la abstracción, no de la clase concreta.
 *  - O: se puede reemplazar la implementación (p. ej. por una con caché) sin tocar a los clientes.
 *  - I: expone sólo las operaciones del módulo.
 */
public interface ParteInteresadaService {

    List<ParteInteresadaDto> listar();

    ParteInteresadaDto obtener(String id);

    ParteInteresadaDto crear(ParteInteresadaDto dto);

    ParteInteresadaDto actualizar(String id, ParteInteresadaDto dto);

    void eliminar(String id);
}
