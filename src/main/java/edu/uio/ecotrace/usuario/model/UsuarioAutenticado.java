package edu.uio.ecotrace.usuario.model;

import java.io.Serializable;
import org.springframework.security.core.AuthenticatedPrincipal;

/**
 * "Principal" que se guarda en la sesión HTTP tras un login exitoso.
 *
 * Es inmutable y serializable (la sesión puede persistirse) y NO contiene el hash de la clave:
 * el repositorio de referencia guardaba la entidad completa —con la clave— en la sesión.
 *
 * Conexión: AuthController lo crea; los controladores lo reciben con @AuthenticationPrincipal.
 * Implementa AuthenticatedPrincipal para que Authentication.getName() devuelva el username
 * (sin esto Spring usaría toString() del record).
 */
public record UsuarioAutenticado(Long id, String username, String nombreCompleto, Rol rol) implements AuthenticatedPrincipal, Serializable {

    @Override
    public String getName() {
        return username;
    }

    public static UsuarioAutenticado de(Usuario u) {
        return new UsuarioAutenticado(u.getId(), u.getUsername(), u.getNombreCompleto(), u.getRol());
    }
}
