package edu.uio.ecotrace.nucleo.service;

import edu.uio.ecotrace.cumplimiento.auditoria.service.ActividadService;
import edu.uio.ecotrace.cumplimiento.requisito.service.RequisitoService;
import edu.uio.ecotrace.evidencia.service.EvidenciaService;
import edu.uio.ecotrace.hallazgo.service.HallazgoService;
import edu.uio.ecotrace.integracion.ingesta.service.IngestaService;
import edu.uio.ecotrace.monitoreo.service.MonitoreoService;
import edu.uio.ecotrace.nucleo.dto.NucleoSnapshotDto;
import edu.uio.ecotrace.parteinteresada.service.ParteInteresadaService;
import edu.uio.ecotrace.puntomonitoreo.service.PuntoMonitoreoService;
import edu.uio.ecotrace.relaciones.service.QuejaService;
import org.springframework.stereotype.Service;

/**
 * Implementación de NucleoService: reglas de negocio de el snapshot del núcleo de datos.
 * Reúne en una sola respuesta lo que el frontend necesita al iniciar.
 * Usa transacciones (@Transactional) y no sabe nada de HTTP ni de JSON (como el ClienteService del proyecto de referencia).
 */
@Service
public class NucleoServiceImpl implements NucleoService {

    private final PuntoMonitoreoService puntos;
    private final MonitoreoService monitoreo;
    private final ParteInteresadaService partes;
    private final RequisitoService requisitos;
    private final HallazgoService hallazgos;
    private final QuejaService quejas;
    private final EvidenciaService evidencias;
    private final IngestaService ingesta;
    private final ActividadService actividad;

    public NucleoServiceImpl(PuntoMonitoreoService puntos, MonitoreoService monitoreo, ParteInteresadaService partes,
                         RequisitoService requisitos, HallazgoService hallazgos, QuejaService quejas,
                         EvidenciaService evidencias, IngestaService ingesta, ActividadService actividad) {
        this.puntos = puntos;
        this.monitoreo = monitoreo;
        this.partes = partes;
        this.requisitos = requisitos;
        this.hallazgos = hallazgos;
        this.quejas = quejas;
        this.evidencias = evidencias;
        this.ingesta = ingesta;
        this.actividad = actividad;
    }

    @Override
    public NucleoSnapshotDto snapshot(int horas) {
        return new NucleoSnapshotDto(puntos.listar(), monitoreo.lecturasNucleo(horas, 7), partes.listar(), requisitos.listar(),
                hallazgos.listar(), quejas.listar(), evidencias.listar(), ingesta.recientes(), actividad.recientes());
    }
}
