package edu.uio.ecotrace.hallazgo.model;

import edu.uio.ecotrace.shared.model.EntidadAuditable;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/** No conformidad: creada a mano o automáticamente por una excedencia. */
@Entity
@Table(name = "hallazgo")
public class Hallazgo extends EntidadAuditable {

    @Id
    private String id;
    private String titulo;
    /** alta | media | baja */
    private String severidad;
    /** abierto | en curso | cerrado */
    private String estado;
    private String origen;
    @Column(name = "punto_id")
    private String puntoId;
    private String parametro;
    @Column(name = "fecha_limite")
    private Instant fechaLimite;
    private String responsable;

    public Hallazgo() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getSeveridad() {
        return severidad;
    }

    public void setSeveridad(String severidad) {
        this.severidad = severidad;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getOrigen() {
        return origen;
    }

    public void setOrigen(String origen) {
        this.origen = origen;
    }

    public String getPuntoId() {
        return puntoId;
    }

    public void setPuntoId(String puntoId) {
        this.puntoId = puntoId;
    }

    public String getParametro() {
        return parametro;
    }

    public void setParametro(String parametro) {
        this.parametro = parametro;
    }

    public Instant getFechaLimite() {
        return fechaLimite;
    }

    public void setFechaLimite(Instant fechaLimite) {
        this.fechaLimite = fechaLimite;
    }

    public String getResponsable() {
        return responsable;
    }

    public void setResponsable(String responsable) {
        this.responsable = responsable;
    }
}
