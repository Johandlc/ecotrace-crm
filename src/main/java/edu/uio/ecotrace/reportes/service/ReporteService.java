package edu.uio.ecotrace.reportes.service;

import edu.uio.ecotrace.reportes.dto.InformeCumplimientoDto;

/**
 * Contrato de la lógica de negocio de los informes de cumplimiento.
 *
 * Conexión: ReporteController (u otros servicios) dependen de esta interfaz; ReporteServiceImpl la implementa.
 *
 * SOLID:
 *  - D: quien la usa depende de la abstracción, no de la clase concreta.
 *  - O: se puede reemplazar la implementación (p. ej. por una con caché) sin tocar a los clientes.
 *  - I: expone sólo las operaciones del módulo.
 */
public interface ReporteService {

    InformeCumplimientoDto informe(String requisitoId, int horas);

    String csv(String requisitoId, int horas);
}
