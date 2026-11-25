package edu.uio.ecotrace.reportes.service;

import edu.uio.ecotrace.cumplimiento.requisito.mapper.RequisitoMapper;
import edu.uio.ecotrace.cumplimiento.requisito.model.Requisito;
import edu.uio.ecotrace.cumplimiento.requisito.service.RequisitoService;
import edu.uio.ecotrace.evidencia.mapper.EvidenciaMapper;
import edu.uio.ecotrace.evidencia.repository.EvidenciaRepository;
import edu.uio.ecotrace.hallazgo.dto.HallazgoDto;
import edu.uio.ecotrace.hallazgo.mapper.HallazgoMapper;
import edu.uio.ecotrace.hallazgo.repository.HallazgoRepository;
import edu.uio.ecotrace.monitoreo.model.Lectura;
import edu.uio.ecotrace.monitoreo.repository.LecturaRepository;
import edu.uio.ecotrace.parteinteresada.mapper.ParteInteresadaMapper;
import edu.uio.ecotrace.parteinteresada.repository.ParteInteresadaRepository;
import edu.uio.ecotrace.puntomonitoreo.model.PuntoMonitoreo;
import edu.uio.ecotrace.puntomonitoreo.repository.PuntoMonitoreoRepository;
import edu.uio.ecotrace.reportes.dto.FilaReporteDto;
import edu.uio.ecotrace.reportes.dto.InformeCumplimientoDto;
import edu.uio.ecotrace.shared.enums.Parametro;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.DoubleSummaryStatistics;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementación de ReporteService: reglas de negocio de los informes de cumplimiento.
 * Agrega lecturas, hallazgos y evidencias de los puntos de un requisito.
 * Usa transacciones (@Transactional) y no sabe nada de HTTP ni de JSON (como el ClienteService del proyecto de referencia).
 */
@Service
@Transactional(readOnly = true)
public class ReporteServiceImpl implements ReporteService {

    private final RequisitoService requisitos;
    private final RequisitoMapper requisitoMapper;
    private final LecturaRepository lecturas;
    private final PuntoMonitoreoRepository puntos;
    private final HallazgoRepository hallazgos;
    private final HallazgoMapper hallazgoMapper;
    private final EvidenciaRepository evidencias;
    private final EvidenciaMapper evidenciaMapper;
    private final ParteInteresadaRepository partes;
    private final ParteInteresadaMapper parteMapper;

    public ReporteServiceImpl(RequisitoService requisitos, RequisitoMapper requisitoMapper, LecturaRepository lecturas,
                          PuntoMonitoreoRepository puntos, HallazgoRepository hallazgos, HallazgoMapper hallazgoMapper,
                          EvidenciaRepository evidencias, EvidenciaMapper evidenciaMapper,
                          ParteInteresadaRepository partes, ParteInteresadaMapper parteMapper) {
        this.requisitos = requisitos;
        this.requisitoMapper = requisitoMapper;
        this.lecturas = lecturas;
        this.puntos = puntos;
        this.hallazgos = hallazgos;
        this.hallazgoMapper = hallazgoMapper;
        this.evidencias = evidencias;
        this.evidenciaMapper = evidenciaMapper;
        this.partes = partes;
        this.parteMapper = parteMapper;
    }

    @Override
    public InformeCumplimientoDto informe(String requisitoId, int horas) {
        Requisito q = requisitos.entidad(requisitoId);
        List<String> ids = new ArrayList<>(q.getPuntoIds());
        Map<String, PuntoMonitoreo> mapa = puntos.findAllById(ids).stream().collect(Collectors.toMap(PuntoMonitoreo::getId, p -> p));
        List<Lectura> ls = ids.isEmpty() ? List.of() : lecturas.findByPuntoIdInAndFechaMedicionAfter(ids, Instant.now().minus(Duration.ofHours(horas)));

        Map<String, List<Lectura>> grupos = new TreeMap<>(ls.stream().collect(Collectors.groupingBy(l -> l.getPuntoId() + "|" + l.getParametro())));
        List<FilaReporteDto> filas = new ArrayList<>();
        grupos.forEach((k, g) -> {
            Parametro p = Parametro.desdeCodigo(g.getFirst().getParametro()).orElseThrow();
            DoubleSummaryStatistics st = g.stream().mapToDouble(Lectura::getValor).summaryStatistics();
            PuntoMonitoreo pt = mapa.get(g.getFirst().getPuntoId());
            filas.add(new FilaReporteDto(pt.getId(), pt.getNombre(), p.etiqueta(), p.unidad(), g.size(),
                    Math.round(st.getAverage() * 100) / 100.0, st.getMax(), p.maximo(), (int) g.stream().filter(Lectura::isExcede).count()));
        });

        List<HallazgoDto> hs = ids.isEmpty() ? List.of() : hallazgos.findByPuntoIdIn(ids).stream().map(hallazgoMapper::toDto).toList();
        Set<String> entidades = new HashSet<>(hs.stream().map(HallazgoDto::id).toList());
        entidades.add(q.getId());
        var autoridad = q.getAutoridadId() == null ? null : partes.findById(q.getAutoridadId()).map(parteMapper::toDto).orElse(null);
        return new InformeCumplimientoDto(requisitoMapper.toDto(q), autoridad, horas, filas, hs,
                evidencias.findByEntidadIdIn(entidades).stream().map(evidenciaMapper::toDto).toList(), Instant.now().toEpochMilli());
    }

    @Override
    public String csv(String requisitoId, int horas) {
        StringBuilder sb = new StringBuilder("punto,nombre,parametro,unidad,n,promedio,maximo,limite,excedencias\n");
        for (FilaReporteDto f : informe(requisitoId, horas).rows()) {
            sb.append(String.join(",", f.punto(), '"' + f.nombre() + '"', f.parametro(), f.unidad(), String.valueOf(f.n()),
                    String.valueOf(f.promedio()), String.valueOf(f.maximo()), String.valueOf(f.limite()), String.valueOf(f.excedencias()))).append('\n');
        }
        return sb.toString();
    }
}
