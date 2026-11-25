package edu.uio.ecotrace.territorio.service;

import tools.jackson.databind.JsonNode;
import java.util.Set;

/**
 * Contrato de la lógica de negocio de el territorio de Quito (zonas, fuentes de emisión y datasets reales).
 *
 * Conexión: DatosReferenciaController (u otros servicios) dependen de esta interfaz; DatosReferenciaServiceImpl la implementa.
 *
 * SOLID:
 *  - D: quien la usa depende de la abstracción, no de la clase concreta.
 *  - O: se puede reemplazar la implementación (p. ej. por una con caché) sin tocar a los clientes.
 *  - I: expone sólo las operaciones del módulo.
 */
public interface DatosReferenciaService {

    Set<String> DATASETS = Set.of("remmaq", "climatetrace-quito", "inventario-pacq-2015", "normas-calidad-aire", "fuentes-informacion");
    JsonNode dataset(String nombre);
}
