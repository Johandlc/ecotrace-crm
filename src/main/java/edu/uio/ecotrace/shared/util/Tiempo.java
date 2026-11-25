package edu.uio.ecotrace.shared.util;

import java.time.Instant;

/** Conversión entre Instant (persistencia) y epoch millis (contrato JSON con el frontend). */
public final class Tiempo {

    private Tiempo() {
    }

    public static Long aMillis(Instant instant) {
        return instant == null ? null : instant.toEpochMilli();
    }

    public static Instant desdeMillis(Long millis) {
        return millis == null ? null : Instant.ofEpochMilli(millis);
    }
}
