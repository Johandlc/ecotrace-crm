package edu.uio.ecotrace.integracion;

import static org.assertj.core.api.Assertions.assertThat;

import edu.uio.ecotrace.integracion.ingesta.dto.RegistroEntradaDto;
import edu.uio.ecotrace.integracion.ingesta.dto.ResultadoIngestaDto;
import edu.uio.ecotrace.integracion.ingesta.dto.SolicitudIngestaDto;
import edu.uio.ecotrace.integracion.ingesta.service.IngestaService;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class IngestaServiceTest {

    @Autowired
    IngestaService ingesta;

    @Test
    void validaLoteDeLaboratorioYCreaHallazgoPorExcedencia() {
        String ts = String.valueOf(Instant.now().minusSeconds(7200).toEpochMilli());
        List<RegistroEntradaDto> lote = List.of(
                new RegistroEntradaDto("P-MAC", "ph", "7.1", "", ts),
                new RegistroEntradaDto("P-MAC", "dbo", "45", "mg/L", ts),       // excede 30 mg/L
                new RegistroEntradaDto("P-SPE", "sst", "-3", "mg/L", ts),       // negativo
                new RegistroEntradaDto("P-XXX", "ph", "7.0", "", ts),           // punto inexistente
                new RegistroEntradaDto("P-SPE", "turbiedad", "12", "NTU", ts),  // no catalogado
                new RegistroEntradaDto("P-MAC", "pm2_5", "10", "", ts),         // no aplica a agua
                new RegistroEntradaDto("P-MAC", "ph", "7.2", "", ts));          // duplicado en el lote

        ResultadoIngestaDto r = ingesta.procesar(new SolicitudIngestaDto("externa", "laboratorio", "Test", lote));

        assertThat(r.received()).isEqualTo(7);
        assertThat(r.accepted()).isEqualTo(2);
        assertThat(r.rejected()).isEqualTo(4);
        assertThat(r.duplicates()).isEqualTo(1);
        assertThat(r.exceedances()).isEqualTo(1);
        assertThat(r.created()).singleElement().satisfies(h -> {
            assertThat(h.pointId()).isEqualTo("P-MAC");
            assertThat(h.param()).isEqualTo("dbo");
            assertThat(h.severity()).isEqualTo("alta");
        });
        assertThat(r.errors()).extracting(e -> e.reason()).noneMatch(m -> m.startsWith("Duplicado"));

        // Reenviar el mismo lote: todo se omite como duplicado, nada cuenta como error.
        ResultadoIngestaDto otra = ingesta.procesar(new SolicitudIngestaDto("externa", "laboratorio", "Test", lote));
        assertThat(otra.accepted()).isZero();
        assertThat(otra.duplicates()).isEqualTo(3);
        assertThat(otra.rejected()).isEqualTo(4);
    }
}
