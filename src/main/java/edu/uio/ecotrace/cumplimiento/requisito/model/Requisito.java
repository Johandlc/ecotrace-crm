package edu.uio.ecotrace.cumplimiento.requisito.model;

import edu.uio.ecotrace.shared.model.EntidadAuditable;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;

/** Permiso o norma aplicable, con su autoridad y los puntos de monitoreo que la evidencian. */
@Entity
@Table(name = "requisito")
public class Requisito extends EntidadAuditable {

    @Id
    private String id;
    private String titulo;
    /** permiso | norma */
    private String tipo;
    @Column(name = "autoridad_id")
    private String autoridadId;
    /** null = norma permanente */
    private Instant vence;
    private String obligaciones;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "requisito_punto", joinColumns = @JoinColumn(name = "requisito_id"))
    @Column(name = "punto_id")
    private Set<String> puntoIds = new LinkedHashSet<>();

    public Requisito() {
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

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getAutoridadId() {
        return autoridadId;
    }

    public void setAutoridadId(String autoridadId) {
        this.autoridadId = autoridadId;
    }

    public Instant getVence() {
        return vence;
    }

    public void setVence(Instant vence) {
        this.vence = vence;
    }

    public String getObligaciones() {
        return obligaciones;
    }

    public void setObligaciones(String obligaciones) {
        this.obligaciones = obligaciones;
    }

    public Set<String> getPuntoIds() {
        return puntoIds;
    }

    public void setPuntoIds(Set<String> puntoIds) {
        this.puntoIds = puntoIds;
    }
}
