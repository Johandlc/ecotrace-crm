package edu.uio.ecotrace.usuario.model;

/**
 * Roles del CRM y lo que cada uno puede hacer.
 *
 * Conexión: se guarda como texto en usuario.rol; SeguridadConfig lo traduce a la autoridad
 * "ROLE_x" de Spring Security y el frontend lo usa para mostrar u ocultar acciones.
 *
 * SOLID (O): agregar un rol nuevo sólo requiere una constante aquí y su regla en SeguridadConfig.
 */
public enum Rol {
    /** Todo, incluida la gestión de usuarios. */
    ADMIN("Administrador", true, true),
    /** Registra y modifica información ambiental; no gestiona usuarios. */
    ANALISTA("Analista ambiental", true, false),
    /** Sólo consulta (p. ej. gerencia o auditor externo). */
    LECTOR("Lector", false, false);

    private final String descripcion;
    private final boolean puedeEditar;
    private final boolean puedeAdministrar;

    Rol(String descripcion, boolean puedeEditar, boolean puedeAdministrar) {
        this.descripcion = descripcion;
        this.puedeEditar = puedeEditar;
        this.puedeAdministrar = puedeAdministrar;
    }

    public String descripcion() { return descripcion; }

    public boolean puedeEditar() { return puedeEditar; }

    public boolean puedeAdministrar() { return puedeAdministrar; }

    /** Nombre de la autoridad que entiende Spring Security (hasRole("ADMIN") ⇔ "ROLE_ADMIN"). */
    public String autoridad() { return "ROLE_" + name(); }
}
