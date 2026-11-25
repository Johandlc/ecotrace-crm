package edu.uio.ecotrace.integracion.externa.service;

import edu.uio.ecotrace.integracion.externa.dto.BoletinDto;
import edu.uio.ecotrace.integracion.externa.openaq.dto.UbicacionOpenAqDto;
import edu.uio.ecotrace.integracion.ingesta.dto.ResultadoIngestaDto;
import java.util.List;

/**
 * Contrato de la lógica de negocio de las fuentes externas (Open-Meteo, OpenAQ, boletín).
 *
 * Conexión: SincronizacionExternaController (u otros servicios) dependen de esta interfaz; SincronizacionExternaServiceImpl la implementa.
 *
 * SOLID:
 *  - D: quien la usa depende de la abstracción, no de la clase concreta.
 *  - O: se puede reemplazar la implementación (p. ej. por una con caché) sin tocar a los clientes.
 *  - I: expone sólo las operaciones del módulo.
 */
public interface SincronizacionExternaService {

    double QUITO_LAT = -0.2201;

    double QUITO_LON = -78.5123;
    ResultadoIngestaDto sincronizarOpenMeteo(int horas);

    BoletinDto boletinAutoridad();

    List<UbicacionOpenAqDto> estacionesOpenAqQuito();
}
