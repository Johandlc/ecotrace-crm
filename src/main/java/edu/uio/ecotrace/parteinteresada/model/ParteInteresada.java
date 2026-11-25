package edu.uio.ecotrace.parteinteresada.model;

import edu.uio.ecotrace.shared.model.EntidadAuditable;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Entidad JPA ParteInteresada (tabla parte_interesada).
 * Sólo datos: las reglas viven en el servicio del módulo.
 */
@Entity
@Table(name = "parte_interesada")
public class ParteInteresada extends EntidadAuditable {

    @Id
    private String id;
    private String nombre;
    /** autoridad | comunidad | laboratorio | auditor | proveedor */
    private String tipo;
    private String contacto;
    private Integer influencia;
    /** positivo | neutral | negativo */
    private String percepcion;

    public ParteInteresada() {
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

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getContacto() {
        return contacto;
    }

    public void setContacto(String contacto) {
        this.contacto = contacto;
    }

    public Integer getInfluencia() {
        return influencia;
    }

    public void setInfluencia(Integer influencia) {
        this.influencia = influencia;
    }

    public String getPercepcion() {
        return percepcion;
    }

    public void setPercepcion(String percepcion) {
        this.percepcion = percepcion;
    }
}
