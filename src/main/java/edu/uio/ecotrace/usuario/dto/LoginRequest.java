package edu.uio.ecotrace.usuario.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * JSON de entrada de POST /api/v1/auth/login, p. ej. {"username":"admin","password":"Admin123!"}.
 *
 * SOLID (S): sólo transporta la petición. Bean Validation reemplaza los "if (x == null)" manuales
 * del AuthController de referencia y produce un 400 uniforme vía GlobalExceptionHandler.
 */
public record LoginRequest(
        @NotBlank(message = "El usuario es obligatorio") @Size(max = 40) String username,
        @NotBlank(message = "La contraseña es obligatoria") @Size(max = 100) String password) {
}
