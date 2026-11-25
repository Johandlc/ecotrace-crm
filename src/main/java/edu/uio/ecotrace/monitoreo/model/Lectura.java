package edu.uio.ecotrace.monitoreo.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/** Medición validada de un parámetro en un punto de monitoreo. */
@Entity
@Table(name = "lectura")
public class Lectura {

    @Id
    private String id;
    @Column(name = "punto_id")
    private String puntoId;
    private String parametro;
    private Double valor;
    @Column(name = "fecha_medicion")
    private Instant fechaMedicion;
    /** interna | externa */
    private String fuente;
    /** sensor | formulario | laboratorio | api | demo | remmaq */
    private String canal;
    private boolean excede;

    public Lectura() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public Double getValor() {
        return valor;
    }

    public void setValor(Double valor) {
        this.valor = valor;
    }

    public Instant getFechaMedicion() {
        return fechaMedicion;
    }

    public void setFechaMedicion(Instant fechaMedicion) {
        this.fechaMedicion = fechaMedicion;
    }

    public String getFuente() {
        return fuente;
    }

    public void setFuente(String fuente) {
        this.fuente = fuente;
    }

    public String getCanal() {
        return canal;
    }

    public void setCanal(String canal) {
        this.canal = canal;
    }

    public boolean isExcede() {
        return excede;
    }

    public void setExcede(boolean excede) {
        this.excede = excede;
    }
}
