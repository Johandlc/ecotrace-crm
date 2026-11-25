package edu.uio.ecotrace.integracion.ingesta.rules;

import edu.uio.ecotrace.shared.enums.Parametro;
import java.time.Instant;

/** Registro tras la etapa de normalización. parametro/valor/fecha pueden ser null si no se pudieron interpretar. */
public record RegistroNormalizado(int fila, String puntoId, String parametroCrudo, Parametro parametro, Double valor, Instant fecha) {

    public String clave() {
        return puntoId + "|" + (parametro == null ? parametroCrudo : parametro.codigo()) + "|" + (fecha == null ? "" : fecha.toEpochMilli());
    }
}
