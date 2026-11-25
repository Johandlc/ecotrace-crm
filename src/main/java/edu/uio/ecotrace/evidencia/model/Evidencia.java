package edu.uio.ecotrace.evidencia.model;

import edu.uio.ecotrace.shared.model.EntidadAuditable;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/** Metadatos de un soporte documental asociado a un requisito, hallazgo o queja. */
@Entity
@Table(name = "evidencia")
public class Evidencia extends EntidadAuditable {

    @Id
    private String id;
    private String nombre;
    /** requirements | findings | complaints */
    private String entidad;
    @Column(name = "entidad_id")
    private String entidadId;
    private Instant fecha;

    public Evidencia() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getEntidad() {
        return entidad;
    }

    public void setEntidad(String entidad) {
        this.entidad = entidad;
    }

    public String getEntidadId() {
        return entidadId;
    }

    public void setEntidadId(String entidadId) {
        this.entidadId = entidadId;
    }

    public Instant getFecha() {
        return fecha;
    }

    public void setFecha(Instant fecha) {
        this.fecha = fecha;
    }
}
