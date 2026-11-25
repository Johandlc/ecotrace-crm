package edu.uio.ecotrace.integracion.ingesta.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/** Bitácora de cada lote que pasa por la capa de integración y validación. */
@Entity
@Table(name = "lote_ingesta")
public class LoteIngesta {

    @Id
    private String id;
    private Instant fecha;
    private String fuente;
    private String canal;
    private String etiqueta;
    private int recibidos;
    private int aceptados;
    private int rechazados;
    /** Registros que ya existían en el núcleo: se omiten sin contarse como error. */
    private int duplicados;
    private int excedencias;
    private int hallazgos;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "lote_ingesta_error", joinColumns = @JoinColumn(name = "lote_id"))
    private List<ErrorIngesta> errores = new ArrayList<>();

    public LoteIngesta() {
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

    public String getEtiqueta() {
        return etiqueta;
    }

    public void setEtiqueta(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    public int getRecibidos() {
        return recibidos;
    }

    public void setRecibidos(int recibidos) {
        this.recibidos = recibidos;
    }

    public int getAceptados() {
        return aceptados;
    }

    public void setAceptados(int aceptados) {
        this.aceptados = aceptados;
    }

    public int getRechazados() {
        return rechazados;
    }

    public void setRechazados(int rechazados) {
        this.rechazados = rechazados;
    }

    public int getDuplicados() {
        return duplicados;
    }

    public void setDuplicados(int duplicados) {
        this.duplicados = duplicados;
    }

    public int getExcedencias() {
        return excedencias;
    }

    public void setExcedencias(int excedencias) {
        this.excedencias = excedencias;
    }

    public int getHallazgos() {
        return hallazgos;
    }

    public void setHallazgos(int hallazgos) {
        this.hallazgos = hallazgos;
    }

    public List<ErrorIngesta> getErrores() {
        return errores;
    }

    public void setErrores(List<ErrorIngesta> errores) {
        this.errores = errores;
    }
}
