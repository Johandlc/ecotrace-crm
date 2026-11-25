package edu.uio.ecotrace.shared.exception;

/** Violación de una regla de negocio (HTTP 422). */
public class BusinessException extends RuntimeException {

    public BusinessException(String message) {
        super(message);
    }
}
