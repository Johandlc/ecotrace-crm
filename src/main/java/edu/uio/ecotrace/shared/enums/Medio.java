package edu.uio.ecotrace.shared.enums;

import java.util.Arrays;
import java.util.Optional;

/** Medio ambiental que se monitorea. */
public enum Medio {
    AIRE("aire"), AGUA("agua"), RUIDO("ruido");

    private final String codigo;

    Medio(String codigo) {
        this.codigo = codigo;
    }

    public String codigo() {
        return codigo;
    }

    public static Optional<Medio> desde(String codigo) {
        return Arrays.stream(values()).filter(m -> m.codigo.equalsIgnoreCase(codigo)).findFirst();
    }
}
