package edu.uio.ecotrace.cumplimiento.requisito.service;

import edu.uio.ecotrace.cumplimiento.requisito.dto.RequisitoDto;
import edu.uio.ecotrace.cumplimiento.requisito.model.Requisito;
import java.util.List;

/**
 * Contrato de la lógica de negocio de los requisitos de cumplimiento (permisos y normas).
 *
 * Conexión: RequisitoController (u otros servicios) dependen de esta interfaz; RequisitoServiceImpl la implementa.
 *
 * SOLID:
 *  - D: quien la usa depende de la abstracción, no de la clase concreta.
 *  - O: se puede reemplazar la implementación (p. ej. por una con caché) sin tocar a los clientes.
 *  - I: expone sólo las operaciones del módulo.
 */
public interface RequisitoService {

    List<RequisitoDto> listar();

    RequisitoDto obtener(String id);

    Requisito entidad(String id);

    RequisitoDto crear(RequisitoDto dto);

    RequisitoDto actualizar(String id, RequisitoDto dto);

    void eliminar(String id);
}
