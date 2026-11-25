package edu.uio.ecotrace.usuario.service;

import edu.uio.ecotrace.usuario.dto.PortadaResponse;
import edu.uio.ecotrace.usuario.dto.SesionResponse;

/**
 * Reglas de autenticación del CRM.
 *
 * Conexión: AuthController la usa; AuthServiceImpl la implementa con UsuarioRepository y BCrypt.
 *
 * SOLID:
 *  - S: decide si unas credenciales son válidas y aplica el bloqueo; no sabe de HTTP ni de cookies
 *    (la sesión la maneja el controlador, igual que en el proyecto de referencia).
 *  - D: el controlador depende de esta interfaz.
 */
public interface AuthService {

    /**
     * Valida usuario y clave.
     * @throws edu.uio.ecotrace.usuario.exception.CredencialesInvalidasException si no coinciden
     * @throws edu.uio.ecotrace.usuario.exception.CuentaBloqueadaException si está bloqueada o inactiva
     */
    ResultadoAutenticacion autenticar(String username, String password);

    /** Datos actualizados de la sesión del usuario indicado. */
    SesionResponse sesion(String username);

    /** Información pública para la pantalla de login. */
    PortadaResponse portada();

    /** Registra el cierre de sesión en la auditoría. */
    void registrarCierre(String username);
}
