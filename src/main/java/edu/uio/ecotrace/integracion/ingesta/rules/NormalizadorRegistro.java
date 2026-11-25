package edu.uio.ecotrace.integracion.ingesta.rules;

import edu.uio.ecotrace.integracion.ingesta.dto.RegistroEntradaDto;
import edu.uio.ecotrace.shared.enums.Parametro;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.Map;
import org.springframework.stereotype.Component;

/** Etapa 2 · Normalización: alias de parámetros, conversión de unidades y fechas. */
@Component
public class NormalizadorRegistro {

    /** Fechas sin zona se interpretan en hora de Ecuador continental. */
    public static final ZoneId ZONA_LOCAL = ZoneId.of("America/Guayaquil");
    private static final Map<String, Double> A_MICROGRAMOS = Map.of("mg/m³", 1000.0, "mg/m3", 1000.0);

    public RegistroNormalizado normalizar(RegistroEntradaDto r, int fila) {
        String punto = r.pointId() == null ? "" : r.pointId().trim().toUpperCase();
        Parametro p = Parametro.desdeCodigo(r.param()).orElse(null);
        Double valor = numero(r.value());
        String unidad = r.unit() == null ? "" : r.unit().trim();
        if (valor != null && p != null && "µg/m³".equals(p.unidad()) && A_MICROGRAMOS.containsKey(unidad)) {
            valor = valor * A_MICROGRAMOS.get(unidad);
        }
        return new RegistroNormalizado(fila, punto, r.param() == null ? "" : r.param().trim().toLowerCase(), p, valor, fecha(r.ts()));
    }

    static Double numero(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            double v = Double.parseDouble(raw.trim().replace(',', '.'));
            return Double.isFinite(v) ? v : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    static Instant fecha(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String s = raw.trim();
        try {
            if (s.matches("\\d{10,}")) return Instant.ofEpochMilli(Long.parseLong(s));
            if (s.endsWith("Z")) return Instant.parse(s.length() == 17 ? s.replace("Z", ":00Z") : s);
            if (s.matches(".*[+-]\\d{2}:\\d{2}$")) return OffsetDateTime.parse(s).toInstant();
            return LocalDateTime.parse(s).atZone(ZONA_LOCAL).toInstant();
        } catch (DateTimeParseException | NumberFormatException e) {
            return null;
        }
    }
}
