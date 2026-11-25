package edu.uio.ecotrace.integracion.ingesta.service;

import edu.uio.ecotrace.cumplimiento.auditoria.service.ActividadService;
import edu.uio.ecotrace.hallazgo.dto.HallazgoDto;
import edu.uio.ecotrace.hallazgo.service.HallazgoService;
import edu.uio.ecotrace.integracion.ingesta.dto.LoteIngestaDto;
import edu.uio.ecotrace.integracion.ingesta.dto.RegistroEntradaDto;
import edu.uio.ecotrace.integracion.ingesta.dto.ResultadoIngestaDto;
import edu.uio.ecotrace.integracion.ingesta.dto.SolicitudIngestaDto;
import edu.uio.ecotrace.integracion.ingesta.model.ErrorIngesta;
import edu.uio.ecotrace.integracion.ingesta.model.LoteIngesta;
import edu.uio.ecotrace.integracion.ingesta.repository.LoteIngestaRepository;
import edu.uio.ecotrace.integracion.ingesta.rules.NormalizadorRegistro;
import edu.uio.ecotrace.integracion.ingesta.rules.RegistroNormalizado;
import edu.uio.ecotrace.integracion.ingesta.rules.ValidadorRegistro;
import edu.uio.ecotrace.monitoreo.model.Lectura;
import edu.uio.ecotrace.monitoreo.repository.LecturaRepository;
import edu.uio.ecotrace.puntomonitoreo.model.PuntoMonitoreo;
import edu.uio.ecotrace.puntomonitoreo.repository.PuntoMonitoreoRepository;
import edu.uio.ecotrace.shared.util.IdGenerator;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Capa de integración y validación: ningún dato llega al núcleo sin pasar por aquí.
 * Recibido → Normalizado → Validado → Almacenado (+ reglas de negocio: excedencias → hallazgos).
 */
@Service
public class IngestaServiceImpl implements IngestaService {

    private final PuntoMonitoreoRepository puntos;
    private final LecturaRepository lecturas;
    private final LoteIngestaRepository lotes;
    private final NormalizadorRegistro normalizador;
    private final ValidadorRegistro validador;
    private final HallazgoService hallazgos;
    private final ActividadService actividad;

    public IngestaServiceImpl(PuntoMonitoreoRepository puntos, LecturaRepository lecturas, LoteIngestaRepository lotes,
                          NormalizadorRegistro normalizador, ValidadorRegistro validador, HallazgoService hallazgos,
                          ActividadService actividad) {
        this.puntos = puntos;
        this.lecturas = lecturas;
        this.lotes = lotes;
        this.normalizador = normalizador;
        this.validador = validador;
        this.hallazgos = hallazgos;
        this.actividad = actividad;
    }

    @Transactional
    @Override
    public ResultadoIngestaDto procesar(SolicitudIngestaDto solicitud) {
        Instant ahora = Instant.now();
        List<RegistroEntradaDto> entrada = solicitud.records();

        // 1-2 · Recibido + normalizado
        List<RegistroNormalizado> normalizados = IntStream.range(0, entrada.size())
                .mapToObj(i -> normalizador.normalizar(entrada.get(i), i + 1)).toList();

        // 3 · Validación (incluye duplicados contra el núcleo y dentro del mismo lote)
        Map<String, PuntoMonitoreo> mapaPuntos = puntos.findAll().stream().collect(Collectors.toMap(PuntoMonitoreo::getId, Function.identity()));
        Set<String> claves = clavesExistentes(normalizados);
        List<ErrorIngesta> errores = new ArrayList<>();
        List<RegistroNormalizado> validos = new ArrayList<>();
        int duplicados = 0;
        for (RegistroNormalizado r : normalizados) {
            var motivo = validador.validar(r, mapaPuntos, claves, ahora);
            if (motivo.filter(ValidadorRegistro.DUPLICADO::equals).isPresent()) {
                duplicados++; // re-sincronizar una fuente no es un error de calidad
            } else if (motivo.isPresent()) {
                errores.add(new ErrorIngesta(r.fila(), motivo.get()));
            } else {
                claves.add(r.clave());
                validos.add(r);
            }
        }

        // 4 · Almacenamiento + regla de negocio
        List<Lectura> nuevas = validos.stream().map(r -> {
            Lectura l = new Lectura();
            l.setId(IdGenerator.nuevo("R"));
            l.setPuntoId(r.puntoId());
            l.setParametro(r.parametro().codigo());
            l.setValor(Math.round(r.valor() * 100.0) / 100.0);
            l.setFechaMedicion(r.fecha());
            l.setFuente(solicitud.source());
            l.setCanal(solicitud.channel());
            l.setExcede(r.parametro().excede(r.valor()));
            return l;
        }).toList();
        lecturas.saveAll(nuevas);

        List<HallazgoDto> creados = new ArrayList<>();
        Set<String> evaluados = new HashSet<>();
        for (int i = 0; i < validos.size(); i++) {
            RegistroNormalizado r = validos.get(i);
            if (!nuevas.get(i).isExcede() || !evaluados.add(r.puntoId() + "|" + r.parametro().codigo())) continue;
            hallazgos.abrirPorExcedencia(r.puntoId(), mapaPuntos.get(r.puntoId()).getNombre(), r.parametro(), r.valor())
                    .ifPresent(creados::add);
        }

        LoteIngesta lote = new LoteIngesta();
        lote.setId(IdGenerator.nuevo("I"));
        lote.setFecha(ahora);
        lote.setFuente(solicitud.source());
        lote.setCanal(solicitud.channel());
        lote.setEtiqueta(solicitud.label());
        lote.setRecibidos(entrada.size());
        lote.setAceptados(nuevas.size());
        lote.setRechazados(errores.size());
        lote.setDuplicados(duplicados);
        lote.setExcedencias((int) nuevas.stream().filter(Lectura::isExcede).count());
        lote.setHallazgos(creados.size());
        lote.setErrores(errores.size() > 200 ? new ArrayList<>(errores.subList(0, 200)) : errores);
        lotes.save(lote);

        actividad.registrar("%s: %d nuevos, %d ya existían, %d rechazados".formatted(solicitud.label(), nuevas.size(), duplicados, errores.size()),
                "externa".equals(solicitud.source()) ? "ext" : "int");
        return ResultadoIngestaDto.de(toDto(lote), creados);
    }

    @Transactional(readOnly = true)
    @Override
    public List<LoteIngestaDto> recientes() {
        return lotes.findTop50ByOrderByFechaDesc().stream().map(this::toDto).toList();
    }

    private Set<String> clavesExistentes(List<RegistroNormalizado> rs) {
        List<Instant> fechas = rs.stream().map(RegistroNormalizado::fecha).filter(Objects::nonNull).sorted().toList();
        if (fechas.isEmpty()) return new HashSet<>();
        return lecturas.clavesEntre(fechas.getFirst(), fechas.getLast()).stream()
                .map(o -> o[0] + "|" + o[1] + "|" + ((Instant) o[2]).toEpochMilli())
                .collect(Collectors.toCollection(HashSet::new));
    }

    private LoteIngestaDto toDto(LoteIngesta l) {
        return new LoteIngestaDto(l.getId(), l.getFecha().toEpochMilli(), l.getFuente(), l.getCanal(), l.getEtiqueta(),
                l.getRecibidos(), l.getAceptados(), l.getRechazados(), l.getDuplicados(), l.getExcedencias(), l.getHallazgos(),
                l.getErrores().stream().map(e -> new LoteIngestaDto.ErrorDto(e.getFila(), e.getMotivo())).toList());
    }
}
