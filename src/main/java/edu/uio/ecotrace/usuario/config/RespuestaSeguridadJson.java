package edu.uio.ecotrace.usuario.config;

import edu.uio.ecotrace.shared.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

/**
 * Respuestas 401/403 en el mismo formato JSON (ApiResponse) que el resto de la API,
 * en lugar de la página HTML o el diálogo del navegador que Spring Security usaría por defecto.
 */
@Component
public class RespuestaSeguridadJson implements AuthenticationEntryPoint, AccessDeniedHandler {

    private final JsonMapper json;

    public RespuestaSeguridadJson(JsonMapper json) {
        this.json = json;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException e) throws IOException {
        escribir(response, HttpServletResponse.SC_UNAUTHORIZED, "Inicia sesión para continuar");
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException e) throws IOException {
        escribir(response, HttpServletResponse.SC_FORBIDDEN, "Tu rol no permite realizar esta acción");
    }

    private void escribir(HttpServletResponse response, int status, String mensaje) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        json.writeValue(response.getOutputStream(), ApiResponse.error(mensaje, null));
    }
}
