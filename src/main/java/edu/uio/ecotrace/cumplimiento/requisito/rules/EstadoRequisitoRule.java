package edu.uio.ecotrace.cumplimiento.requisito.rules;

import java.time.Duration;
import java.time.Instant;

/** Deriva el estado de un requisito a partir de su fecha de vencimiento (no se persiste). */
public final class EstadoRequisitoRule {

    public static final Duration VENTANA_ALERTA = Duration.ofDays(60);

    private EstadoRequisitoRule() {
    }

    public static String calcular(Instant vence, Instant ahora) {
        if (vence == null) return "vigente";
        if (vence.isBefore(ahora)) return "vencido";
        if (vence.isBefore(ahora.plus(VENTANA_ALERTA))) return "por vencer";
        return "vigente";
    }
}
