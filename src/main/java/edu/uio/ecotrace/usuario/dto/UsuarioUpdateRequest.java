package edu.uio.ecotrace.usuario.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Cambios parciales de un usuario (PATCH): los campos nulos no se modifican. */
public record UsuarioUpdateRequest(
        @Size(max = 120) String nombre,
        @Email @Size(max = 120) String correo,
        @Pattern(regexp = "ADMIN|ANALISTA|LECTOR") String rol,
        Boolean activo,
        @Size(min = 8, max = 100) @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "Debe tener al menos una letra y un número") String password) {
}
