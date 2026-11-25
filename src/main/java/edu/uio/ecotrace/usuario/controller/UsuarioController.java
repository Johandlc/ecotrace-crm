package edu.uio.ecotrace.usuario.controller;

import edu.uio.ecotrace.shared.response.ApiResponse;
import edu.uio.ecotrace.usuario.dto.UsuarioRequest;
import edu.uio.ecotrace.usuario.dto.UsuarioResponse;
import edu.uio.ecotrace.usuario.dto.UsuarioUpdateRequest;
import edu.uio.ecotrace.usuario.service.UsuarioService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * Administración de usuarios (la ruta exige rol ADMIN en SeguridadConfig).
 *   GET    /api/v1/usuarios               listar
 *   POST   /api/v1/usuarios               crear (201 · 400 · 409)
 *   PATCH  /api/v1/usuarios/{id}          cambiar nombre, correo, rol, estado o clave
 *   POST   /api/v1/usuarios/{id}/desbloquear
 *   DELETE /api/v1/usuarios/{id}          desactivar (baja lógica)
 */
@Tag(name = "Usuarios")
@RestController
@RequestMapping("/api/v1/usuarios")
public class UsuarioController {

    private final UsuarioService service;

    public UsuarioController(UsuarioService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<UsuarioResponse>> listar() {
        return ApiResponse.ok(service.listar());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<UsuarioResponse> crear(@Valid @RequestBody UsuarioRequest request) {
        return ApiResponse.ok("Usuario creado", service.crear(request));
    }

    @PatchMapping("/{id}")
    public ApiResponse<UsuarioResponse> actualizar(@PathVariable Long id, @Valid @RequestBody UsuarioUpdateRequest request, Authentication auth) {
        return ApiResponse.ok(service.actualizar(id, request, auth.getName()));
    }

    @PostMapping("/{id}/desbloquear")
    public ApiResponse<UsuarioResponse> desbloquear(@PathVariable Long id) {
        return ApiResponse.ok("Cuenta desbloqueada", service.desbloquear(id));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> desactivar(@PathVariable Long id, Authentication auth) {
        service.desactivar(id, auth.getName());
        return ApiResponse.ok("Usuario desactivado", null);
    }
}
