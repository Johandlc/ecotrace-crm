package edu.uio.ecotrace.usuario.dto;

/** Vista pública de un usuario para la administración (sin hash de contraseña). */
public record UsuarioResponse(Long id, String username, String nombre, String iniciales, String correo, String rol,
                              boolean activo, boolean bloqueado, int intentosFallidos, Long ultimoAcceso, Long creadoEn) {
}
