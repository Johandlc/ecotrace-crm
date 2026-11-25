package edu.uio.ecotrace.territorio.service;

import edu.uio.ecotrace.integracion.externa.openmeteo.client.OpenMeteoClient;
import edu.uio.ecotrace.integracion.externa.openmeteo.dto.Coordenada;
import edu.uio.ecotrace.integracion.externa.openmeteo.dto.ValoresActuales;
import edu.uio.ecotrace.territorio.dto.CalidadAireZonaDto;
import edu.uio.ecotrace.territorio.dto.FuenteEmisionDto;
import edu.uio.ecotrace.territorio.dto.ZonaDto;
import edu.uio.ecotrace.territorio.mapper.TerritorioMapper;
import edu.uio.ecotrace.territorio.model.Zona;
import edu.uio.ecotrace.territorio.repository.FuenteEmisionRepository;
import edu.uio.ecotrace.territorio.repository.ZonaRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementación de TerritorioService: reglas de negocio de el territorio de Quito (zonas, fuentes de emisión y datasets reales).
 * Los datasets reales (REMMAQ, Climate TRACE, PACQ) se sirven desde src/main/resources/datos.
 * Usa transacciones (@Transactional) y no sabe nada de HTTP ni de JSON (como el ClienteService del proyecto de referencia).
 */
@Service
@Transactional(readOnly = true)
public class TerritorioServiceImpl implements TerritorioService {

    private static final List<String> VARIABLES = List.of("pm2_5", "pm10", "nitrogen_dioxide", "carbon_dioxide", "carbon_monoxide", "us_aqi");
    private static final Map<String, String> CLAVE = Map.of("nitrogen_dioxide", "no2", "carbon_dioxide", "co2", "carbon_monoxide", "co");
    private static final Duration CACHE = Duration.ofMinutes(10);

    private final ZonaRepository zonas;
    private final FuenteEmisionRepository fuentes;
    private final TerritorioMapper mapper;
    private final OpenMeteoClient openMeteo;

    private volatile List<CalidadAireZonaDto> cache = List.of();
    private volatile Instant cacheEn = Instant.EPOCH;

    public TerritorioServiceImpl(ZonaRepository zonas, FuenteEmisionRepository fuentes, TerritorioMapper mapper, OpenMeteoClient openMeteo) {
        this.zonas = zonas;
        this.fuentes = fuentes;
        this.mapper = mapper;
        this.openMeteo = openMeteo;
    }

    @Override
    public List<ZonaDto> zonas() {
        return zonas.findAll().stream().map(mapper::toDto).toList();
    }

    @Override
    public List<FuenteEmisionDto> fuentes(String sector, String zonaId) {
        var rows = sector != null ? fuentes.findBySector(sector) : zonaId != null ? fuentes.findByZonaId(zonaId) : fuentes.findAll();
        return rows.stream().map(mapper::toDto).toList();
    }

    /** Valores actuales por zona, con caché de 10 min para no saturar la API externa. */
    @Override
    public List<CalidadAireZonaDto> calidadAire() {
        if (Instant.now().isBefore(cacheEn.plus(CACHE)) && !cache.isEmpty()) return cache;
        List<Zona> zs = zonas.findAll();
        List<ValoresActuales> actuales = openMeteo.actual(zs.stream().map(z -> new Coordenada(z.getLatitud(), z.getLongitud())).toList(), VARIABLES);
        List<CalidadAireZonaDto> out = new ArrayList<>();
        for (int i = 0; i < zs.size() && i < actuales.size(); i++) {
            Map<String, Double> v = new LinkedHashMap<>();
            actuales.get(i).valores().forEach((k, val) -> v.put(CLAVE.getOrDefault(k, k), val));
            out.add(new CalidadAireZonaDto(zs.get(i).getId(), actuales.get(i).tiempo().toEpochMilli(), v, "Open-Meteo · CAMS"));
        }
        cache = out;
        cacheEn = Instant.now();
        return out;
    }
}
