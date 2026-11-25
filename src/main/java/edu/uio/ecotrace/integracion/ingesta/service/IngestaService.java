package edu.uio.ecotrace.integracion.ingesta.service;

import edu.uio.ecotrace.integracion.ingesta.dto.LoteIngestaDto;
import edu.uio.ecotrace.integracion.ingesta.dto.ResultadoIngestaDto;
import edu.uio.ecotrace.integracion.ingesta.dto.SolicitudIngestaDto;
import java.util.List;

/**
 * Contrato de la lógica de negocio de la capa de integración y validación.
 *
 * Conexión: IngestaController (u otros servicios) dependen de esta interfaz; IngestaServiceImpl la implementa.
 *
 * SOLID:
 *  - D: quien la usa depende de la abstracción, no de la clase concreta.
 *  - O: se puede reemplazar la implementación (p. ej. por una con caché) sin tocar a los clientes.
 *  - I: expone sólo las operaciones del módulo.
 */
public interface IngestaService {

    ResultadoIngestaDto procesar(SolicitudIngestaDto solicitud);

    List<LoteIngestaDto> recientes();
}
