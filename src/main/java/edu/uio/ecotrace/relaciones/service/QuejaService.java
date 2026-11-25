package edu.uio.ecotrace.relaciones.service;

import edu.uio.ecotrace.relaciones.dto.QuejaDto;
import java.util.List;

/**
 * Contrato de la lógica de negocio de las quejas y solicitudes de partes interesadas.
 *
 * Conexión: QuejaController (u otros servicios) dependen de esta interfaz; QuejaServiceImpl la implementa.
 *
 * SOLID:
 *  - D: quien la usa depende de la abstracción, no de la clase concreta.
 *  - O: se puede reemplazar la implementación (p. ej. por una con caché) sin tocar a los clientes.
 *  - I: expone sólo las operaciones del módulo.
 */
public interface QuejaService {

    List<QuejaDto> listar();

    QuejaDto crear(QuejaDto dto);

    QuejaDto actualizar(String id, QuejaDto dto);

    void eliminar(String id);
}
