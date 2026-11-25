package edu.uio.ecotrace.integracion;

import static org.assertj.core.api.Assertions.assertThat;

import edu.uio.ecotrace.integracion.ingesta.dto.RegistroEntradaDto;
import edu.uio.ecotrace.integracion.ingesta.rules.NormalizadorRegistro;
import edu.uio.ecotrace.integracion.ingesta.rules.RegistroNormalizado;
import edu.uio.ecotrace.shared.enums.Parametro;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class NormalizadorRegistroTest {

    private final NormalizadorRegistro n = new NormalizadorRegistro();

    @Test
    void resuelveAliasYConvierteMiligramos() {
        RegistroNormalizado r = n.normalizar(new RegistroEntradaDto("p-bel", "PM2.5", "0,03", "mg/m³", "2026-11-04T10:00Z"), 1);
        assertThat(r.puntoId()).isEqualTo("P-BEL");
        assertThat(r.parametro()).isEqualTo(Parametro.PM2_5);
        assertThat(r.valor()).isEqualTo(30.0);
        assertThat(r.fecha()).isEqualTo(Instant.parse("2026-11-04T10:00:00Z"));
    }

    @Test
    void fechaSinZonaSeInterpretaEnHoraDeEcuador() {
        RegistroNormalizado r = n.normalizar(new RegistroEntradaDto("P-MAC", "ph", "7.1", "", "2026-11-04T10:00"), 1);
        assertThat(r.fecha()).isEqualTo(Instant.parse("2026-11-04T15:00:00Z"));
    }

    @Test
    void valoresYFechasIlegiblesQuedanNulos() {
        RegistroNormalizado r = n.normalizar(new RegistroEntradaDto("P-MAC", "turbiedad", "abc", null, "ayer"), 3);
        assertThat(r.parametro()).isNull();
        assertThat(r.valor()).isNull();
        assertThat(r.fecha()).isNull();
    }
}
