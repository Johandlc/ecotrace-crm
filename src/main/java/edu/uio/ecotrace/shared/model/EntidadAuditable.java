package edu.uio.ecotrace.shared.model;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import java.time.Instant;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

/** Fechas de creación/modificación gestionadas por JPA Auditing (ver config.JpaConfig). */
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class EntidadAuditable {

    @CreatedDate
    @Column(name = "creado_en", updatable = false)
    private Instant creadoEn;

    @LastModifiedDate
    @Column(name = "actualizado_en")
    private Instant actualizadoEn;

    public Instant getCreadoEn() {
        return creadoEn;
    }

    public void setCreadoEn(Instant creadoEn) {
        this.creadoEn = creadoEn;
    }

    public Instant getActualizadoEn() {
        return actualizadoEn;
    }

    public void setActualizadoEn(Instant actualizadoEn) {
        this.actualizadoEn = actualizadoEn;
    }
}
