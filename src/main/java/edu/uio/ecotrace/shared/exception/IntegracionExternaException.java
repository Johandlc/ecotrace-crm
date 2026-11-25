package edu.uio.ecotrace.shared.exception;

/** Falla al consultar una fuente externa (HTTP 502). */
public class IntegracionExternaException extends RuntimeException {

    public IntegracionExternaException(String message, Throwable cause) {
        super(message, cause);
    }

    public IntegracionExternaException(String message) {
        super(message);
    }
}
