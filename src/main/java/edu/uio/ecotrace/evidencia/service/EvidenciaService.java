package edu.uio.ecotrace.evidencia.service;

import edu.uio.ecotrace.evidencia.dto.EvidenciaDto;
import java.util.List;

/**
 * Contrato de la lógica de negocio de las evidencias documentales.
 *
 * Conexión: EvidenciaController (u otros servicios) dependen de esta interfaz; EvidenciaServiceImpl la implementa.
 *
 * SOLID:
 *  - D: quien la usa depende de la abstracción, no de la clase concreta.
 *  - O: se puede reemplazar la implementación (p. ej. por una con caché) sin tocar a los clientes.
 *  - I: expone sólo las operaciones del módulo.
 */
public interface EvidenciaService {

    List<EvidenciaDto> listar();

    EvidenciaDto crear(EvidenciaDto dto);

    EvidenciaDto actualizar(String id, EvidenciaDto dto);

    void eliminar(String id);
}
