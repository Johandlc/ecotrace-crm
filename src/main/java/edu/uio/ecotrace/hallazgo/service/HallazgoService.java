package edu.uio.ecotrace.hallazgo.service;

import edu.uio.ecotrace.hallazgo.dto.HallazgoDto;
import edu.uio.ecotrace.shared.enums.Parametro;
import java.util.List;
import java.util.Optional;

/**
 * Contrato de la lógica de negocio de los hallazgos (no conformidades).
 *
 * Conexión: HallazgoController (u otros servicios) dependen de esta interfaz; HallazgoServiceImpl la implementa.
 *
 * SOLID:
 *  - D: quien la usa depende de la abstracción, no de la clase concreta.
 *  - O: se puede reemplazar la implementación (p. ej. por una con caché) sin tocar a los clientes.
 *  - I: expone sólo las operaciones del módulo.
 */
public interface HallazgoService {

    List<HallazgoDto> listar();

    HallazgoDto obtener(String id);

    HallazgoDto crear(HallazgoDto dto);

    Optional<HallazgoDto> abrirPorExcedencia(String puntoId, String nombrePunto, Parametro p, double valor);

    HallazgoDto actualizar(String id, HallazgoDto dto);

    void eliminar(String id);
}
