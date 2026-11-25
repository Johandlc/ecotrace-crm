package edu.uio.ecotrace.usuario.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Alta de usuario (sólo ADMIN). La política de contraseña exige 8+ caracteres con letra y número.
 */
public record UsuarioRequest(
        @NotBlank @Size(min = 3, max = 40) @Pattern(regexp = "[A-Za-z0-9._-]+", message = "Sólo letras, números, punto, guion y guion bajo") String username,
        @NotBlank @Size(max = 120) String nombre,
        @Email @Size(max = 120) String correo,
        @NotBlank @Pattern(regexp = "ADMIN|ANALISTA|LECTOR") String rol,
        @NotBlank @Size(min = 8, max = 100) @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "Debe tener al menos una letra y un número") String password) {
}
