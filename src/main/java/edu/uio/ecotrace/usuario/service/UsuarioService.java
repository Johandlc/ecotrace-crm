package edu.uio.ecotrace.usuario.service;

import edu.uio.ecotrace.usuario.dto.UsuarioRequest;
import edu.uio.ecotrace.usuario.dto.UsuarioResponse;
import edu.uio.ecotrace.usuario.dto.UsuarioUpdateRequest;
import java.util.List;

/**
 * Administración de usuarios (sólo ADMIN).
 * SOLID (I): separado de AuthService porque lo usan actores distintos (administrador vs. cualquier usuario).
 */
public interface UsuarioService {

    List<UsuarioResponse> listar();

    UsuarioResponse crear(UsuarioRequest request);

    /** @param actor username de quien hace el cambio (no puede desactivarse ni quitarse el rol de ADMIN a sí mismo) */
    UsuarioResponse actualizar(Long id, UsuarioUpdateRequest request, String actor);

    UsuarioResponse desbloquear(Long id);

    /** Desactiva (baja lógica): se conserva la trazabilidad de la auditoría. */
    void desactivar(Long id, String actor);
}
