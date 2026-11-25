package edu.uio.ecotrace.shared.response;

import java.time.Instant;

/** Envoltorio estándar de todas las respuestas de la API interna. */
public record ApiResponse<T>(boolean success, String message, T data, Instant timestamp) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, "OK", data, Instant.now());
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return new ApiResponse<>(true, message, data, Instant.now());
    }

    public static <T> ApiResponse<T> error(String message, T detail) {
        return new ApiResponse<>(false, message, detail, Instant.now());
    }
}
