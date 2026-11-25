package edu.uio.ecotrace.integracion.ingesta.rules;

import edu.uio.ecotrace.puntomonitoreo.model.PuntoMonitoreo;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.springframework.stereotype.Component;

/** Etapa 3 · Validación. Devuelve el motivo de rechazo o vacío si el registro es válido. */
@Component
public class ValidadorRegistro {

    public static final String DUPLICADO = "Duplicado (ya existe en el núcleo)";

    public Optional<String> validar(RegistroNormalizado r, Map<String, PuntoMonitoreo> puntos, Set<String> clavesExistentes, Instant ahora) {
        PuntoMonitoreo punto = puntos.get(r.puntoId());
        if (punto == null) return Optional.of("Punto \"" + r.puntoId() + "\" no registrado");
        if (r.parametro() == null) return Optional.of("Parámetro \"" + r.parametroCrudo() + "\" no catalogado");
        if (!r.parametro().medio().codigo().equals(punto.getMedio()))
            return Optional.of(r.parametro().etiqueta() + " no aplica a un punto de " + punto.getMedio());
        if (r.valor() == null) return Optional.of("Valor vacío o no numérico");
        if (r.valor() < 0) return Optional.of("Valor negativo");
        if (r.fecha() == null) return Optional.of("Fecha inválida");
        if (r.fecha().isAfter(ahora.plus(Duration.ofHours(1)))) return Optional.of("Fecha futura");
        if (clavesExistentes.contains(r.clave())) return Optional.of(DUPLICADO);
        return Optional.empty();
    }
}
