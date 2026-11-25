package edu.uio.ecotrace.puntomonitoreo.service;

import edu.uio.ecotrace.puntomonitoreo.dto.PuntoMonitoreoDto;
import java.util.List;

/**
 * Contrato de la lógica de negocio de los puntos de monitoreo (estaciones REMMAQ y puntos propios).
 *
 * Conexión: PuntoMonitoreoController (u otros servicios) dependen de esta interfaz; PuntoMonitoreoServiceImpl la implementa.
 *
 * SOLID:
 *  - D: quien la usa depende de la abstracción, no de la clase concreta.
 *  - O: se puede reemplazar la implementación (p. ej. por una con caché) sin tocar a los clientes.
 *  - I: expone sólo las operaciones del módulo.
 */
public interface PuntoMonitoreoService {

    List<PuntoMonitoreoDto> listar();

    PuntoMonitoreoDto obtener(String id);

    PuntoMonitoreoDto crear(PuntoMonitoreoDto dto);

    PuntoMonitoreoDto actualizar(String id, PuntoMonitoreoDto dto);

    void eliminar(String id);
}
