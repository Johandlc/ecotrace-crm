package edu.uio.ecotrace.monitoreo.service;

import edu.uio.ecotrace.monitoreo.dto.LecturaDto;
import edu.uio.ecotrace.monitoreo.dto.ParametroDto;
import edu.uio.ecotrace.monitoreo.mapper.LecturaMapper;
import edu.uio.ecotrace.monitoreo.model.Lectura;
import edu.uio.ecotrace.monitoreo.repository.LecturaRepository;
import edu.uio.ecotrace.shared.enums.Parametro;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Stream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementación de MonitoreoService: reglas de negocio de las lecturas validadas de monitoreo.
 * Las lecturas sólo entran por la capa de integración (IngestaService); aquí únicamente se consultan.
 * Usa transacciones (@Transactional) y no sabe nada de HTTP ni de JSON (como el ClienteService del proyecto de referencia).
 */
@Service
@Transactional(readOnly = true)
public class MonitoreoServiceImpl implements MonitoreoService {

    private final LecturaRepository repository;
    private final LecturaMapper mapper;

    public MonitoreoServiceImpl(LecturaRepository repository, LecturaMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public List<LecturaDto> lecturas(String puntoId, String parametro, int horas) {
        Instant desde = Instant.now().minus(Duration.ofHours(horas));
        List<Lectura> rows;
        if (puntoId != null && parametro != null) {
            rows = repository.findByPuntoIdAndParametroAndFechaMedicionAfterOrderByFechaMedicionAsc(puntoId, parametro, desde);
        } else if (puntoId != null) {
            rows = repository.findByPuntoIdAndFechaMedicionAfterOrderByFechaMedicionAsc(puntoId, desde);
        } else {
            rows = repository.findByFechaMedicionAfterOrderByFechaMedicionAsc(desde);
        }
        return rows.stream().map(mapper::toDto).toList();
    }

    @Override
    public List<LecturaDto> lecturasNucleo(int horas, int diasOficiales) {
        Instant desde = Instant.now().minus(Duration.ofHours(horas));
        List<Lectura> recientes = repository.findByFechaMedicionAfterOrderByFechaMedicionAsc(desde);
        Instant ultimaOficial = repository.ultimaFechaDeCanal("remmaq");
        Stream<Lectura> oficiales = ultimaOficial == null || ultimaOficial.isAfter(desde) ? Stream.empty()
                : repository.findByCanalAndFechaMedicionAfterOrderByFechaMedicionAsc("remmaq", ultimaOficial.minus(Duration.ofDays(diasOficiales)))
                        .stream().filter(l -> l.getFechaMedicion().isBefore(desde) || l.getFechaMedicion().equals(desde));
        return Stream.concat(oficiales, recientes.stream()).map(mapper::toDto).toList();
    }

    @Override
    public List<ParametroDto> catalogo() {
        return Arrays.stream(Parametro.values()).map(mapper::toDto).toList();
    }
}
