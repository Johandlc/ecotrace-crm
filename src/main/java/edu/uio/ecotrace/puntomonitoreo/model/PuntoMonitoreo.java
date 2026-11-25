package edu.uio.ecotrace.puntomonitoreo.model;

import edu.uio.ecotrace.shared.model.EntidadAuditable;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Entidad JPA PuntoMonitoreo (tabla punto_monitoreo).
 * Sólo datos: las reglas viven en el servicio del módulo.
 */
@Entity
@Table(name = "punto_monitoreo")
public class PuntoMonitoreo extends EntidadAuditable {

    @Id
    private String id;
    private String nombre;
    /** aire | agua | ruido */
    private String medio;
    private String sitio;
    @Column(name = "zona_id")
    private String zonaId;
    private Double latitud;
    private Double longitud;

    public PuntoMonitoreo() {
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

    public String getMedio() {
        return medio;
    }

    public void setMedio(String medio) {
        this.medio = medio;
    }

    public String getSitio() {
        return sitio;
    }

    public void setSitio(String sitio) {
        this.sitio = sitio;
    }

    public String getZonaId() {
        return zonaId;
    }

    public void setZonaId(String zonaId) {
        this.zonaId = zonaId;
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
}
