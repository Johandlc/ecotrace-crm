package edu.uio.ecotrace.cumplimiento;

import static org.assertj.core.api.Assertions.assertThat;

import edu.uio.ecotrace.cumplimiento.requisito.rules.EstadoRequisitoRule;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class EstadoRequisitoRuleTest {

    private final Instant hoy = Instant.parse("2026-11-04T12:00:00Z");

    @Test
    void calculaEstadoSegunVencimiento() {
        assertThat(EstadoRequisitoRule.calcular(null, hoy)).isEqualTo("vigente");
        assertThat(EstadoRequisitoRule.calcular(hoy.minus(Duration.ofDays(1)), hoy)).isEqualTo("vencido");
        assertThat(EstadoRequisitoRule.calcular(hoy.plus(Duration.ofDays(30)), hoy)).isEqualTo("por vencer");
        assertThat(EstadoRequisitoRule.calcular(hoy.plus(Duration.ofDays(200)), hoy)).isEqualTo("vigente");
    }
}
