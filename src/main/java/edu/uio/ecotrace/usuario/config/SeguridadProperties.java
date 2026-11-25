package edu.uio.ecotrace.usuario.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Propiedades ecotrace.seguridad.* (application*.properties / variables de entorno).
 *
 * @param admin         usuario y clave del administrador inicial (sólo si no hay usuarios)
 * @param cuentasDemo   crea y muestra cuentas de demostración (sólo desarrollo)
 * @param maxIntentos   intentos fallidos antes de bloquear la cuenta
 * @param minutosBloqueo duración del bloqueo temporal
 */
@ConfigurationProperties("ecotrace.seguridad")
public record SeguridadProperties(Admin admin, boolean cuentasDemo, int maxIntentos, int minutosBloqueo) {

    public record Admin(String usuario, String password) {
    }
}
