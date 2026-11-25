package edu.uio.ecotrace.cumplimiento.auditoria.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/** Pista de auditoría: cada cambio relevante en el núcleo queda registrado. */
@Entity
@Table(name = "actividad")
public class Actividad {

    @Id
    private String id;
    private Instant fecha;
    private String texto;
    /** int | ext | danger | neutral — usado por la UI para colorear. */
    private String tono;
    /** Usuario que provocó el cambio ("sistema" para procesos automáticos). */
    private String usuario;

    public Actividad() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Instant getFecha() {
        return fecha;
    }

    public void setFecha(Instant fecha) {
        this.fecha = fecha;
    }

    public String getTexto() {
        return texto;
    }

    public void setTexto(String texto) {
        this.texto = texto;
    }

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public String getTono() {
        return tono;
    }

    public void setTono(String tono) {
        this.tono = tono;
    }
}
