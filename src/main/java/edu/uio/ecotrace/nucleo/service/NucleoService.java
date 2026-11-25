package edu.uio.ecotrace.nucleo.service;

import edu.uio.ecotrace.nucleo.dto.NucleoSnapshotDto;

/**
 * Contrato de la lógica de negocio de el snapshot del núcleo de datos.
 *
 * Conexión: NucleoController (u otros servicios) dependen de esta interfaz; NucleoServiceImpl la implementa.
 *
 * SOLID:
 *  - D: quien la usa depende de la abstracción, no de la clase concreta.
 *  - O: se puede reemplazar la implementación (p. ej. por una con caché) sin tocar a los clientes.
 *  - I: expone sólo las operaciones del módulo.
 */
public interface NucleoService {

    NucleoSnapshotDto snapshot(int horas);
}
