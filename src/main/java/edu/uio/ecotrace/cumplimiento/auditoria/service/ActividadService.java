package edu.uio.ecotrace.cumplimiento.auditoria.service;

import edu.uio.ecotrace.cumplimiento.auditoria.dto.ActividadDto;
import java.util.List;

/**
 * Contrato de la lógica de negocio de la pista de auditoría (actividad).
 *
 * Conexión: ActividadController (u otros servicios) dependen de esta interfaz; ActividadServiceImpl la implementa.
 *
 * SOLID:
 *  - D: quien la usa depende de la abstracción, no de la clase concreta.
 *  - O: se puede reemplazar la implementación (p. ej. por una con caché) sin tocar a los clientes.
 *  - I: expone sólo las operaciones del módulo.
 */
public interface ActividadService {

    /** Registra un evento atribuido al usuario autenticado en el hilo actual (o "sistema"). */
    void registrar(String texto, String tono);

    /** Registra un evento atribuido a un usuario explícito (p. ej. durante el login, antes de crear la sesión). */
    void registrar(String texto, String tono, String usuario);

    List<ActividadDto> recientes();
}
