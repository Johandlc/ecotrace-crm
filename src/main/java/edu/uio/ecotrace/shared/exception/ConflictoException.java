package edu.uio.ecotrace.shared.exception;

/**
 * El recurso choca con otro existente (HTTP 409), p. ej. un username o correo repetido.
 * Equivale a ClienteDuplicadoException del proyecto de referencia, pero compartida por todos los módulos.
 */
public class ConflictoException extends RuntimeException {

    public ConflictoException(String message) {
        super(message);
    }
}
