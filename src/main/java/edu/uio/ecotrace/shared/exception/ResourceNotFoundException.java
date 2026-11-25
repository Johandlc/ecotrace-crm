package edu.uio.ecotrace.shared.exception;

/**
 * El recurso pedido no existe (HTTP 404).
 * Equivale a ClienteNoEncontradoException del proyecto de referencia, pero compartida por todos los módulos.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String recurso, Object id) {
        super("%s con id '%s' no existe".formatted(recurso, id));
    }
}
