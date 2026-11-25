package edu.uio.ecotrace.usuario.dto;

/** Cuenta de demostración listada en la pantalla de login (sólo si ecotrace.seguridad.cuentas-demo=true). */
public record CuentaDemoDto(String username, String password, String rol, String descripcion) {
}
