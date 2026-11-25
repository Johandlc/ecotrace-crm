package edu.uio.ecotrace.territorio.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Fuente emisora georreferenciada. Emisiones en toneladas/año.
 * tipo_dato: "climate-trace" (estimación Climate TRACE) | "osm-sin-dato" (ubicación real, sin inventario público).
 */
@Entity
@Table(name = "fuente_emision")
public class FuenteEmision {

    @Id
    private String id;
    private String nombre;
    private String sector;
    @Column(name = "zona_id")
    private String zonaId;
    private String parroquia;
    private Double latitud;
    private Double longitud;
    private Integer anio;
    @Column(name = "co2e_t")
    private Double co2e;
    @Column(name = "co2_t")
    private Double co2;
    @Column(name = "ch4_t")
    private Double ch4;
    @Column(name = "pm25_t")
    private Double pm25;
    @Column(name = "nox_t")
    private Double nox;
    @Column(name = "so2_t")
    private Double so2;
    @Column(name = "co_t")
    private Double co;
    private String descripcion;
    @Column(name = "tipo_dato")
    private String tipoDato;
    private String referencia;
    @Column(name = "fuente_coordenadas")
    private String fuenteCoordenadas;

    public FuenteEmision() {
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

    public String getSector() {
        return sector;
    }

    public void setSector(String sector) {
        this.sector = sector;
    }

    public String getZonaId() {
        return zonaId;
    }

    public void setZonaId(String zonaId) {
        this.zonaId = zonaId;
    }

    public String getParroquia() {
        return parroquia;
    }

    public void setParroquia(String parroquia) {
        this.parroquia = parroquia;
    }

    public Double getLatitud() {
        return latitud;
    }

    public void setLatitud(Double latitud) {
        this.latitud = latitud;
    }

    public Double getLongitud() {
        return longitud;
    }

    public void setLongitud(Double longitud) {
        this.longitud = longitud;
    }

    public Integer getAnio() {
        return anio;
    }

    public void setAnio(Integer anio) {
        this.anio = anio;
    }

    public Double getCo2e() {
        return co2e;
    }

    public void setCo2e(Double co2e) {
        this.co2e = co2e;
    }

    public Double getCo2() {
        return co2;
    }

    public void setCo2(Double co2) {
        this.co2 = co2;
    }

    public Double getCh4() {
        return ch4;
    }

    public void setCh4(Double ch4) {
        this.ch4 = ch4;
    }

    public Double getPm25() {
        return pm25;
    }

    public void setPm25(Double pm25) {
        this.pm25 = pm25;
    }

    public Double getNox() {
        return nox;
    }

    public void setNox(Double nox) {
        this.nox = nox;
    }

    public Double getSo2() {
        return so2;
    }

    public void setSo2(Double so2) {
        this.so2 = so2;
    }

    public Double getCo() {
        return co;
    }

    public void setCo(Double co) {
        this.co = co;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getTipoDato() {
        return tipoDato;
    }

    public void setTipoDato(String tipoDato) {
        this.tipoDato = tipoDato;
    }

    public String getReferencia() {
        return referencia;
    }

    public void setReferencia(String referencia) {
        this.referencia = referencia;
    }

    public String getFuenteCoordenadas() {
        return fuenteCoordenadas;
    }

    public void setFuenteCoordenadas(String fuenteCoordenadas) {
        this.fuenteCoordenadas = fuenteCoordenadas;
    }
}
