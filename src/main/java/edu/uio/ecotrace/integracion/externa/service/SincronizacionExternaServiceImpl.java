package edu.uio.ecotrace.integracion.externa.service;

import edu.uio.ecotrace.integracion.externa.dto.BoletinDto;
import edu.uio.ecotrace.integracion.externa.openaq.client.OpenAqClient;
import edu.uio.ecotrace.integracion.externa.openaq.dto.UbicacionOpenAqDto;
import edu.uio.ecotrace.integracion.externa.openmeteo.client.OpenMeteoClient;
import edu.uio.ecotrace.integracion.externa.openmeteo.dto.Coordenada;
import edu.uio.ecotrace.integracion.externa.openmeteo.dto.SerieHoraria;
import edu.uio.ecotrace.integracion.ingesta.dto.RegistroEntradaDto;
import edu.uio.ecotrace.integracion.ingesta.dto.ResultadoIngestaDto;
import edu.uio.ecotrace.integracion.ingesta.dto.SolicitudIngestaDto;
import edu.uio.ecotrace.integracion.ingesta.service.IngestaService;
import edu.uio.ecotrace.puntomonitoreo.model.PuntoMonitoreo;
import edu.uio.ecotrace.puntomonitoreo.repository.PuntoMonitoreoRepository;
import edu.uio.ecotrace.shared.exception.BusinessException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.stereotype.Service;

/** Orquesta las fuentes externas: todo lo que traen pasa por la capa de integración (IngestaService). */
@Service
public class SincronizacionExternaServiceImpl implements SincronizacionExternaService {

    static final List<String> VARIABLES = List.of("pm2_5", "pm10", "nitrogen_dioxide", "carbon_dioxide");

    private static final List<BoletinDto> BOLETINES = List.of(
            new BoletinDto("Actualización de la norma de calidad del aire: nuevo límite anual de PM2.5", "norma",
                    "Ajustar umbrales de monitoreo y presentar plan de reducción de material particulado.", "simulado"),
            new BoletinDto("Requerimiento de reporte semestral de emisiones de CO₂e", "norma",
                    "Presentar inventario de gases de efecto invernadero cada 6 meses.", "simulado"),
            new BoletinDto("Requerimiento de información: descargas a ríos de los últimos 90 días", "permiso",
                    "Entregar resultados de laboratorio acreditado y cadenas de custodia.", "simulado"));

    private final OpenMeteoClient openMeteo;
    private final OpenAqClient openAq;
    private final PuntoMonitoreoRepository puntos;
    private final IngestaService ingesta;

    public SincronizacionExternaServiceImpl(OpenMeteoClient openMeteo, OpenAqClient openAq, PuntoMonitoreoRepository puntos, IngestaService ingesta) {
        this.openMeteo = openMeteo;
        this.openAq = openAq;
        this.puntos = puntos;
        this.ingesta = ingesta;
    }

    /** Descarga las últimas {@code horas} de calidad del aire para cada punto de aire y las integra. */
    @Override
    public ResultadoIngestaDto sincronizarOpenMeteo(int horas) {
        List<PuntoMonitoreo> aire = puntos.findByMedio("aire");
        if (aire.isEmpty()) throw new BusinessException("No hay puntos de monitoreo de aire registrados");
        int pastDays = Math.max(1, Math.min(7, (int) Math.ceil(horas / 24.0)));
        List<SerieHoraria> series = openMeteo.horario(aire.stream().map(p -> new Coordenada(p.getLatitud(), p.getLongitud())).toList(), VARIABLES, pastDays);

        Instant ahora = Instant.now();
        Instant desde = ahora.minus(Duration.ofHours(horas));
        List<RegistroEntradaDto> registros = new ArrayList<>();
        for (int i = 0; i < series.size() && i < aire.size(); i++) {
            SerieHoraria s = series.get(i);
            String puntoId = aire.get(i).getId();
            for (int t = 0; t < s.tiempos().size(); t++) {
                Instant ts = s.tiempos().get(t);
                if (ts.isAfter(ahora) || ts.isBefore(desde)) continue;
                for (String v : VARIABLES) {
                    Double val = s.valores().get(v).get(t);
                    if (val != null) registros.add(new RegistroEntradaDto(puntoId, v, String.valueOf(val), s.unidades().get(v), String.valueOf(ts.toEpochMilli())));
                }
            }
        }
        if (registros.isEmpty()) throw new BusinessException("Open-Meteo no devolvió datos en la ventana solicitada");
        return ingesta.procesar(new SolicitudIngestaDto("externa", "api", "Open-Meteo · Calidad del aire (CAMS)", registros));
    }

    /** Boletín regulatorio. SIMULADO: no existe una API pública oficial; reemplazar por scraping o integración real. */
    @Override
    public BoletinDto boletinAutoridad() {
        return BOLETINES.get(ThreadLocalRandom.current().nextInt(BOLETINES.size()));
    }

    @Override
    public List<UbicacionOpenAqDto> estacionesOpenAqQuito() {
        return openAq.ubicacionesCercanas(QUITO_LAT, QUITO_LON, 25000);
    }
}
