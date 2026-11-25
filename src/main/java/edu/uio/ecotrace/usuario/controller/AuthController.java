package edu.uio.ecotrace.usuario.controller;

import edu.uio.ecotrace.shared.response.ApiResponse;
import edu.uio.ecotrace.usuario.dto.LoginRequest;
import edu.uio.ecotrace.usuario.dto.PortadaResponse;
import edu.uio.ecotrace.usuario.dto.SesionResponse;
import edu.uio.ecotrace.usuario.service.AuthService;
import edu.uio.ecotrace.usuario.service.ResultadoAutenticacion;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Capa de presentación de la autenticación: recibe la petición, delega en AuthService y
 * gestiona la sesión HTTP (como el AuthController del proyecto de referencia).
 *
 *   POST /api/v1/auth/login    → 200 sesión · 400 datos inválidos · 401 credenciales · 423 bloqueada
 *   POST /api/v1/auth/logout   → 204
 *   GET  /api/v1/auth/me       → 200 sesión actual · 401 sin sesión
 *   GET  /api/v1/auth/portada  → 200 datos públicos del login
 *   GET  /api/v1/auth/csrf     → 200 token CSRF (también lo deja en la cookie XSRF-TOKEN)
 *
 * SOLID:
 *  - S: sólo HTTP y sesión; la regla "¿credenciales válidas?" está en AuthServiceImpl.
 *  - D: depende de las interfaces AuthService y SecurityContextRepository.
 */
@Tag(name = "Autenticación")
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final SecurityContextRepository contextoRepositorio;
    private final SecurityContextLogoutHandler logoutHandler = new SecurityContextLogoutHandler();

    public AuthController(AuthService authService, SecurityContextRepository contextoRepositorio) {
        this.authService = authService;
        this.contextoRepositorio = contextoRepositorio;
    }

    @Operation(summary = "Inicia sesión y crea la cookie de sesión")
    @PostMapping("/login")
    public ApiResponse<SesionResponse> login(@Valid @RequestBody LoginRequest datos, HttpServletRequest request,
                                             HttpServletResponse response) {
        ResultadoAutenticacion r = authService.autenticar(datos.username(), datos.password());

        Authentication auth = UsernamePasswordAuthenticationToken.authenticated(r.principal(), null,
                List.of(new SimpleGrantedAuthority(r.principal().rol().autoridad())));
        SecurityContext contexto = SecurityContextHolder.createEmptyContext();
        contexto.setAuthentication(auth);
        SecurityContextHolder.setContext(contexto);

        // Evita la fijación de sesión: si ya existía una sesión, se le cambia el id.
        if (request.getSession(false) != null) request.changeSessionId();
        contextoRepositorio.saveContext(contexto, request, response);
        return ApiResponse.ok("Bienvenido, " + r.sesion().nombre(), r.sesion());
    }

    @Operation(summary = "Cierra la sesión actual")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(Authentication auth, HttpServletRequest request, HttpServletResponse response) {
        if (auth != null) authService.registrarCierre(auth.getName());
        logoutHandler.logout(request, response, auth);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Usuario de la sesión actual")
    @GetMapping("/me")
    public ApiResponse<SesionResponse> me(Authentication auth) {
        return ApiResponse.ok(authService.sesion(auth.getName()));
    }

    @Operation(summary = "Datos públicos para la pantalla de login")
    @GetMapping("/portada")
    public ApiResponse<PortadaResponse> portada() {
        return ApiResponse.ok(authService.portada());
    }

    @Operation(summary = "Entrega el token CSRF (la SPA lo pide antes del primer POST)")
    @GetMapping("/csrf")
    public ApiResponse<Map<String, String>> csrf(CsrfToken token) {
        return ApiResponse.ok(Map.of("headerName", token.getHeaderName(), "token", token.getToken()));
    }
}
