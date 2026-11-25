package edu.uio.ecotrace.config;

import edu.uio.ecotrace.integracion.externa.service.SincronizacionExternaService;
import edu.uio.ecotrace.integracion.ingesta.dto.RegistroEntradaDto;
import edu.uio.ecotrace.integracion.ingesta.dto.SolicitudIngestaDto;
import edu.uio.ecotrace.integracion.ingesta.service.IngestaService;
import edu.uio.ecotrace.monitoreo.repository.LecturaRepository;
import edu.uio.ecotrace.puntomonitoreo.model.PuntoMonitoreo;
import edu.uio.ecotrace.puntomonitoreo.repository.PuntoMonitoreoRepository;
import edu.uio.ecotrace.territorio.service.DatosReferenciaService;
import tools.jackson.databind.JsonNode;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Datos iniciales (sólo con ecotrace.demo.seed=true).
 * · Aire: últimos 7 días OFICIALES de la REMMAQ (datos/remmaq.json, canal "remmaq") + modelo Open-Meteo de las últimas 48 h.
 * · Agua y ruido: series sintéticas canal "demo" (no hay API pública equivalente).
 * Todo entra por IngestaService, así que las excedencias generan hallazgos como en producción.
 */
@Component
@ConditionalOnProperty(name = "ecotrace.demo.seed", havingValue = "true")
public class DatosDemoSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatosDemoSeeder.class);
    private static final Map<String, double[]> BASE = Map.of(
            "pm2_5", new double[]{16, 8}, "pm10", new double[]{32, 14}, "no2", new double[]{60, 40}, "co2", new double[]{440, 45},
            "ph", new double[]{7.4, 0.6}, "dbo", new double[]{22, 12}, "sst", new double[]{30, 14}, "db", new double[]{62, 8});
    private static final Map<String, List<String>> PARAMS = Map.of(
            "aire", List.of("pm2_5", "pm10", "no2", "co2"), "agua", List.of("ph", "dbo", "sst"), "ruido", List.of("db"));

    private final LecturaRepository lecturas;
    private final PuntoMonitoreoRepository puntos;
    private final IngestaService ingesta;
    private final SincronizacionExternaService externa;
    private final DatosReferenciaService datos;

    public DatosDemoSeeder(LecturaRepository lecturas, PuntoMonitoreoRepository puntos, IngestaService ingesta,
                           SincronizacionExternaService externa, DatosReferenciaService datos) {
        this.lecturas = lecturas;
        this.puntos = puntos;
        this.ingesta = ingesta;
        this.externa = externa;
        this.datos = datos;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (lecturas.count() > 0) return;
        ingesta.procesar(new SolicitudIngestaDto("externa", "demo", "Demo · laboratorio (agua)", sintetico("agua")));
        ingesta.procesar(new SolicitudIngestaDto("interna", "demo", "Demo · sonómetros (ruido)", sintetico("ruido")));
        var oficiales = remmaq(7);
        var r0 = ingesta.procesar(new SolicitudIngestaDto("externa", "remmaq", "REMMAQ · datos oficiales validados", oficiales));
        log.info("REMMAQ: {} lecturas oficiales integradas ({} rechazadas)", r0.accepted(), r0.rejected());
        try {
            var r = externa.sincronizarOpenMeteo(48);
            log.info("Open-Meteo: {} lecturas reales integradas", r.accepted());
        } catch (RuntimeException e) {
            log.warn("Open-Meteo no disponible ({}); el aire queda sólo con datos REMMAQ", e.getMessage());
        }
    }

    /** Últimos {@code dias} de la serie horaria oficial publicada por la REMMAQ. */
    private List<RegistroEntradaDto> remmaq(int dias) {
        JsonNode h = datos.dataset("remmaq").path("hourly");
        long start = h.path("start").asLong();
        long step = h.path("step").asLong();
        int n = h.path("n").asInt();
        int desde = Math.max(0, n - dias * 24);
        List<RegistroEntradaDto> out = new ArrayList<>();
        h.path("series").properties().forEach(contaminante -> {
            String unidad = "co".equals(contaminante.getKey()) ? "mg/m³" : "µg/m³";
            contaminante.getValue().properties().forEach(estacion -> {
                JsonNode arr = estacion.getValue();
                for (int i = desde; i < n; i++) {
                    if (arr.get(i) == null || arr.get(i).isNull()) continue;
                    out.add(new RegistroEntradaDto(estacion.getKey(), contaminante.getKey(), arr.get(i).asString(), unidad, String.valueOf(start + i * step)));
                }
            });
        });
        return out;
    }

    private List<RegistroEntradaDto> sintetico(String medio) {
        Random rnd = new Random(42);
        Instant ahora = Instant.now().truncatedTo(ChronoUnit.HOURS);
        List<RegistroEntradaDto> out = new ArrayList<>();
        List<PuntoMonitoreo> ps = puntos.findByMedio(medio);
        for (int i = 0; i < ps.size(); i++) {
            for (String p : PARAMS.get(medio)) {
                double[] b = BASE.get(p);
                for (int h = 47; h >= 0; h--) {
                    double wave = Math.sin((h + i * 3) / 4.0) * 0.6 + Math.sin(h / 1.7) * 0.25;
                    double v = Math.max(0, b[0] + b[1] * wave + (rnd.nextDouble() - 0.5) * b[1] * 0.5);
                    out.add(new RegistroEntradaDto(ps.get(i).getId(), p, String.format("%.2f", v).replace(',', '.'), null,
                            String.valueOf(ahora.minus(Duration.ofHours(h)).toEpochMilli())));
                }
            }
        }
        return out;
    }
}
