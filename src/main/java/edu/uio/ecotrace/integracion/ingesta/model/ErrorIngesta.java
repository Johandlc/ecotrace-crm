package edu.uio.ecotrace.integracion.ingesta.model;

import jakarta.persistence.Embeddable;

/**
 * Motivo de rechazo de una fila de un lote (tabla lote_ingesta_error, @Embeddable de LoteIngesta).
 */
@Embeddable
public class ErrorIngesta {

    private int fila;
    private String motivo;

    public ErrorIngesta() {
    }

    public ErrorIngesta(int fila, String motivo) {
        this.fila = fila;
        this.motivo = motivo;
    }

    public int getFila() {
        return fila;
    }

    public String getMotivo() {
        return motivo;
    }
}
