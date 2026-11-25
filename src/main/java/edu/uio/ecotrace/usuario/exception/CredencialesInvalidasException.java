package edu.uio.ecotrace.usuario.exception;

/**
 * Usuario o contraseña incorrectos (HTTP 401). No revela cuál de los dos falló.
 * intentosRestantes permite al login avisar "te quedan N intentos".
 */
public class CredencialesInvalidasException extends RuntimeException {

    private final Integer intentosRestantes;

    public CredencialesInvalidasException(Integer intentosRestantes) {
        super("Usuario o contraseña incorrectos");
        this.intentosRestantes = intentosRestantes;
    }

    public Integer intentosRestantes() {
        return intentosRestantes;
    }
}
