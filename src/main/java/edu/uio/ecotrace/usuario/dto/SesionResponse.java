package edu.uio.ecotrace.usuario.dto;

import java.util.List;

/**
 * Datos de la sesión que el frontend necesita: quién es, su rol y qué puede hacer.
 * Nunca incluye la clave ni su hash.
 */
public record SesionResponse(Long id, String username, String nombre, String iniciales, String rol,
                             String rolDescripcion, List<String> permisos, Long ultimoAcceso) {
}
