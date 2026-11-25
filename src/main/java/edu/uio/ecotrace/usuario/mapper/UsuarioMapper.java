package edu.uio.ecotrace.usuario.mapper;

import edu.uio.ecotrace.shared.util.Tiempo;
import edu.uio.ecotrace.usuario.dto.SesionResponse;
import edu.uio.ecotrace.usuario.dto.UsuarioResponse;
import edu.uio.ecotrace.usuario.model.Rol;
import edu.uio.ecotrace.usuario.model.Usuario;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * Convierte la entidad Usuario en DTOs de salida.
 * SOLID (S): un solo lugar decide qué datos del usuario pueden salir por HTTP (nunca el hash).
 */
@Component
public class UsuarioMapper {

    public UsuarioResponse toResponse(Usuario u) {
        return new UsuarioResponse(u.getId(), u.getUsername(), u.getNombreCompleto(), u.iniciales(), u.getCorreo(),
                u.getRol().name(), u.isActivo(), u.estaBloqueado(Instant.now()), u.getIntentosFallidos(),
                Tiempo.aMillis(u.getUltimoAcceso()), Tiempo.aMillis(u.getCreadoEn()));
    }

    public SesionResponse toSesion(Usuario u, Instant accesoAnterior) {
        return new SesionResponse(u.getId(), u.getUsername(), u.getNombreCompleto(), u.iniciales(), u.getRol().name(),
                u.getRol().descripcion(), permisos(u.getRol()), Tiempo.aMillis(accesoAnterior));
    }

    /** Permisos expresados en lenguaje del frontend (mostrar/ocultar botones). */
    public static List<String> permisos(Rol rol) {
        List<String> p = new ArrayList<>(List.of("consultar"));
        if (rol.puedeEditar()) p.add("editar");
        if (rol.puedeAdministrar()) p.add("administrar");
        return p;
    }
}
