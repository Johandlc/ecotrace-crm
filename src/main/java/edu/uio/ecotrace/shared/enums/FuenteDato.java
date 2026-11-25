package edu.uio.ecotrace.shared.enums;

/** Origen de la información respecto a la organización. */
public enum FuenteDato {
    INTERNA, EXTERNA;

    public String codigo() {
        return name().toLowerCase();
    }
}
