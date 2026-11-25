package edu.uio.ecotrace.shared.exception;

import edu.uio.ecotrace.shared.response.ApiResponse;
import edu.uio.ecotrace.usuario.exception.CredencialesInvalidasException;
import edu.uio.ecotrace.usuario.exception.CuentaBloqueadaException;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * Traduce excepciones a respuestas HTTP con el formato ApiResponse, en un solo lugar.
 *
 * Reemplaza el método responderError() que el ClienteServlet de referencia repetía por controlador
 * (SOLID S y O: un tipo de error nuevo se agrega aquí sin tocar los controladores).
 *
 *   400 validación / JSON mal formado / tipo de parámetro    401 credenciales
 *   403 rol insuficiente   404 no existe   405 método   409 conflicto   415 media type
 *   422 regla de negocio   423 cuenta bloqueada   502 fuente externa   500 inesperado
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler({ResourceNotFoundException.class, NoResourceFoundException.class})
    public ResponseEntity<ApiResponse<Void>> notFound(Exception ex) {
        String msg = ex instanceof NoResourceFoundException ? "Ruta no encontrada" : ex.getMessage();
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(msg, null));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> validation(MethodArgumentNotValidException ex) {
        Map<String, String> campos = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(e -> campos.putIfAbsent(e.getField(), e.getDefaultMessage()));
        return ResponseEntity.badRequest().body(ApiResponse.error("Datos inválidos", campos));
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ApiResponse<Void>> badRequest(Exception ex) {
        String msg = ex instanceof MethodArgumentTypeMismatchException m
                ? "Parámetro '" + m.getName() + "' inválido" : "Cuerpo de la petición mal formado";
        return ResponseEntity.badRequest().body(ApiResponse.error(msg, null));
    }

    @ExceptionHandler(CredencialesInvalidasException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> credenciales(CredencialesInvalidasException ex) {
        Map<String, Object> d = new HashMap<>();
        d.put("intentosRestantes", ex.intentosRestantes());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error(ex.getMessage(), d));
    }

    @ExceptionHandler(CuentaBloqueadaException.class)
    public ResponseEntity<ApiResponse<Map<String, Object>>> bloqueada(CuentaBloqueadaException ex) {
        Map<String, Object> d = new HashMap<>();
        d.put("hasta", ex.hasta() == null ? null : ex.hasta().toEpochMilli());
        return ResponseEntity.status(HttpStatus.LOCKED).body(ApiResponse.error(ex.getMessage(), d));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> forbidden(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Tu rol no permite realizar esta acción", null));
    }

    @ExceptionHandler(ConflictoException.class)
    public ResponseEntity<ApiResponse<Void>> conflict(ConflictoException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(ex.getMessage(), null));
    }

    /** Violación de una restricción única en PostgreSQL (p. ej. dos altas simultáneas del mismo usuario). */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> integrity(DataIntegrityViolationException ex) {
        log.debug("Restricción de integridad", ex);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error("El registro entra en conflicto con otro existente", null));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> method(HttpRequestMethodNotSupportedException ex) {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(ApiResponse.error("Método no permitido", null));
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> mediaType(HttpMediaTypeNotSupportedException ex) {
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE).body(ApiResponse.error("Envíe el cuerpo en JSON (Content-Type: application/json)", null));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> business(BusinessException ex) {
        return ResponseEntity.unprocessableEntity().body(ApiResponse.error(ex.getMessage(), null));
    }

    @ExceptionHandler(IntegracionExternaException.class)
    public ResponseEntity<ApiResponse<Void>> external(IntegracionExternaException ex) {
        log.warn("Fuente externa no disponible: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(ApiResponse.error(ex.getMessage(), null));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> generic(Exception ex) {
        log.error("Error no controlado", ex);
        return ResponseEntity.internalServerError().body(ApiResponse.error("Error interno del servidor", null));
    }
}
