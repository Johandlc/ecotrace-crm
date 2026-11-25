package edu.uio.ecotrace.monitoreo.service;

import edu.uio.ecotrace.monitoreo.dto.LecturaDto;
import edu.uio.ecotrace.monitoreo.dto.ParametroDto;
import java.util.List;

/**
 * Contrato de la lógica de negocio de las lecturas validadas de monitoreo.
 *
 * Conexión: MonitoreoController (u otros servicios) dependen de esta interfaz; MonitoreoServiceImpl la implementa.
 *
 * SOLID:
 *  - D: quien la usa depende de la abstracción, no de la clase concreta.
 *  - O: se puede reemplazar la implementación (p. ej. por una con caché) sin tocar a los clientes.
 *  - I: expone sólo las operaciones del módulo.
 */
public interface MonitoreoService {

    List<LecturaDto> lecturas(String puntoId, String parametro, int horas);

    List<ParametroDto> catalogo();

    /**
     * Lecturas para el núcleo: las de las últimas {@code horas} más los últimos {@code diasOficiales}
     * días PUBLICADOS por la REMMAQ, aunque sean más antiguos que la ventana.
     */
    List<LecturaDto> lecturasNucleo(int horas, int diasOficiales);
}
