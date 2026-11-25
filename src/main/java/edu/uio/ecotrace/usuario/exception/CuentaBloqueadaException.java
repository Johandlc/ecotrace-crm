package edu.uio.ecotrace.usuario.exception;

import java.time.Instant;

/** La cuenta está bloqueada temporalmente por intentos fallidos o desactivada (HTTP 423). */
public class CuentaBloqueadaException extends RuntimeException {

    private final Instant hasta;

    public CuentaBloqueadaException(String mensaje, Instant hasta) {
        super(mensaje);
        this.hasta = hasta;
    }

    public Instant hasta() {
        return hasta;
    }
}
