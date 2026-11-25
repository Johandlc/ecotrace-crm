package edu.uio.ecotrace.usuario.model;

import edu.uio.ecotrace.shared.model.EntidadAuditable;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * Entidad JPA de un usuario del CRM (tabla usuario, migración V3).
 *
 * Diferencias con el Usuario del repositorio de referencia:
 *  - Se persiste en PostgreSQL (antes vivía en un Map en memoria).
 *  - Guarda el hash BCrypt, nunca la clave (antes se comparaba texto plano).
 *  - Lleva estado de seguridad: activo, intentos fallidos y bloqueo temporal.
 *
 * Conexión: UsuarioRepository la lee/escribe; AuthServiceImpl valida credenciales y actualiza
 * los intentos; UsuarioMapper la convierte a DTO para que el hash nunca salga por HTTP.
 *
 * SOLID (S): sólo datos y reglas triviales del propio usuario (¿está bloqueado?).
 */
@Entity
@Table(name = "usuario")
public class Usuario extends EntidadAuditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "nombre_completo")
    private String nombreCompleto;

    private String correo;

    @Enumerated(EnumType.STRING)
    private Rol rol;

    private boolean activo = true;

    @Column(name = "intentos_fallidos")
    private int intentosFallidos;

    @Column(name = "bloqueado_hasta")
    private Instant bloqueadoHasta;

    @Column(name = "ultimo_acceso")
    private Instant ultimoAcceso;

    public Usuario() {
    }

    public Usuario(String username, String passwordHash, String nombreCompleto, String correo, Rol rol) {
        this.username = username;
        this.passwordHash = passwordHash;
        this.nombreCompleto = nombreCompleto;
        this.correo = correo;
        this.rol = rol;
    }

    /** true si hay un bloqueo vigente por intentos fallidos. */
    public boolean estaBloqueado(Instant ahora) {
        return bloqueadoHasta != null && bloqueadoHasta.isAfter(ahora);
    }

    /** Iniciales para el avatar ("Ana Guamán" → "AG"). */
    public String iniciales() {
        String[] partes = nombreCompleto == null ? new String[0] : nombreCompleto.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < partes.length && sb.length() < 2; i++) {
            if (!partes[i].isEmpty()) sb.append(Character.toUpperCase(partes[i].charAt(0)));
        }
        return sb.isEmpty() ? "?" : sb.toString();
    }

    public Long getId() { return id; }

    public String getUsername() { return username; }

    public void setUsername(String username) { this.username = username; }

    public String getPasswordHash() { return passwordHash; }

    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getNombreCompleto() { return nombreCompleto; }

    public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }

    public String getCorreo() { return correo; }

    public void setCorreo(String correo) { this.correo = correo; }

    public Rol getRol() { return rol; }

    public void setRol(Rol rol) { this.rol = rol; }

    public boolean isActivo() { return activo; }

    public void setActivo(boolean activo) { this.activo = activo; }

    public int getIntentosFallidos() { return intentosFallidos; }

    public void setIntentosFallidos(int intentosFallidos) { this.intentosFallidos = intentosFallidos; }

    public Instant getBloqueadoHasta() { return bloqueadoHasta; }

    public void setBloqueadoHasta(Instant bloqueadoHasta) { this.bloqueadoHasta = bloqueadoHasta; }

    public Instant getUltimoAcceso() { return ultimoAcceso; }

    public void setUltimoAcceso(Instant ultimoAcceso) { this.ultimoAcceso = ultimoAcceso; }
}
