package edu.uio.ecotrace.territorio.service;

import edu.uio.ecotrace.territorio.dto.CalidadAireZonaDto;
import edu.uio.ecotrace.territorio.dto.FuenteEmisionDto;
import edu.uio.ecotrace.territorio.dto.ZonaDto;
import java.util.List;

/**
 * Contrato de la lógica de negocio de el territorio de Quito (zonas, fuentes de emisión y datasets reales).
 *
 * Conexión: TerritorioController (u otros servicios) dependen de esta interfaz; TerritorioServiceImpl la implementa.
 *
 * SOLID:
 *  - D: quien la usa depende de la abstracción, no de la clase concreta.
 *  - O: se puede reemplazar la implementación (p. ej. por una con caché) sin tocar a los clientes.
 *  - I: expone sólo las operaciones del módulo.
 */
public interface TerritorioService {

    List<ZonaDto> zonas();

    List<FuenteEmisionDto> fuentes(String sector, String zonaId);

    List<CalidadAireZonaDto> calidadAire();
}
