package edu.uio.ecotrace.relaciones.model;

import edu.uio.ecotrace.shared.model.EntidadAuditable;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * Entidad JPA Queja (tabla queja).
 * Una queja pasa por abierta → en gestión → cerrada.
 */
@Entity
@Table(name = "queja")
public class Queja extends EntidadAuditable {

    @Id
    private String id;
    @Column(name = "parte_id")
    private String parteId;
    private String asunto;
    /** portal | correo | reunión | teléfono */
    private String canal;
    /** abierta | en gestión | cerrada */
    private String estado;
    private Instant fecha;
    @Column(name = "punto_id")
    private String puntoId;

    public Queja() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getParteId() {
        return parteId;
    }

    public void setParteId(String parteId) {
        this.parteId = parteId;
    }

    public String getAsunto() {
        return asunto;
    }

    public void setAsunto(String asunto) {
        this.asunto = asunto;
    }

    public String getCanal() {
        return canal;
    }

    public void setCanal(String canal) {
        this.canal = canal;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public Instant getFecha() {
        return fecha;
    }

    public void setFecha(Instant fecha) {
        this.fecha = fecha;
    }

    public String getPuntoId() {
        return puntoId;
    }

    public void setPuntoId(String puntoId) {
        this.puntoId = puntoId;
    }
}
