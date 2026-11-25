package edu.uio.ecotrace.hallazgo.service;

import edu.uio.ecotrace.cumplimiento.auditoria.service.ActividadService;
import edu.uio.ecotrace.hallazgo.dto.HallazgoDto;
import edu.uio.ecotrace.hallazgo.mapper.HallazgoMapper;
import edu.uio.ecotrace.hallazgo.model.Hallazgo;
import edu.uio.ecotrace.hallazgo.repository.HallazgoRepository;
import edu.uio.ecotrace.shared.enums.Parametro;
import edu.uio.ecotrace.shared.exception.ResourceNotFoundException;
import edu.uio.ecotrace.shared.util.IdGenerator;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementación de HallazgoService: reglas de negocio de los hallazgos (no conformidades).
 * Una excedencia validada abre un hallazgo automáticamente si no hay otro abierto para el mismo punto y parámetro.
 * Usa transacciones (@Transactional) y no sabe nada de HTTP ni de JSON (como el ClienteService del proyecto de referencia).
 */
@Service
@Transactional
public class HallazgoServiceImpl implements HallazgoService {

    private final HallazgoRepository repository;
    private final HallazgoMapper mapper;
    private final ActividadService actividad;

    public HallazgoServiceImpl(HallazgoRepository repository, HallazgoMapper mapper, ActividadService actividad) {
        this.repository = repository;
        this.mapper = mapper;
        this.actividad = actividad;
    }

    @Transactional(readOnly = true)
    @Override
    public List<HallazgoDto> listar() {
        return repository.findAllByOrderByCreadoEnDesc().stream().map(mapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public HallazgoDto obtener(String id) {
        return mapper.toDto(buscar(id));
    }

    @Override
    public HallazgoDto crear(HallazgoDto dto) {
        Hallazgo e = new Hallazgo();
        e.setId(IdGenerator.nuevo("H"));
        e.setSeveridad("media");
        e.setEstado("abierto");
        e.setOrigen("inspección");
        e.setResponsable("Sin asignar");
        e.setFechaLimite(Instant.now().plus(Duration.ofDays(14)));
        mapper.aplicar(dto, e);
        actividad.registrar("Hallazgo registrado: " + e.getTitulo(), "danger");
        return mapper.toDto(repository.save(e));
    }

    /**
     * Regla de negocio: una excedencia abre un hallazgo, salvo que ya exista uno no cerrado
     * para el mismo punto y parámetro. Severidad alta si supera el límite en más de 30 %.
     */
    @Override
    public Optional<HallazgoDto> abrirPorExcedencia(String puntoId, String nombrePunto, Parametro p, double valor) {
        if (repository.existsByPuntoIdAndParametroAndEstadoNot(puntoId, p.codigo(), "cerrado")) return Optional.empty();
        Hallazgo e = new Hallazgo();
        e.setId(IdGenerator.nuevo("H"));
        e.setTitulo((p.promedioHoras() > 1 ? "Valor horario de " : "Excedencia de ") + p.etiqueta() + " sobre el límite (" + p.norma() + ") en " + nombrePunto);
        e.setSeveridad(p.maximo() != null && valor > p.maximo() * 1.3 ? "alta" : "media");
        e.setEstado("abierto");
        e.setOrigen("monitoreo");
        e.setPuntoId(puntoId);
        e.setParametro(p.codigo());
        e.setFechaLimite(Instant.now().plus(Duration.ofDays(7)));
        e.setResponsable("Sin asignar");
        repository.saveAndFlush(e);
        actividad.registrar("Hallazgo creado automáticamente: " + e.getTitulo(), "danger");
        return Optional.of(mapper.toDto(e));
    }

    @Override
    public HallazgoDto actualizar(String id, HallazgoDto dto) {
        Hallazgo e = buscar(id);
        String antes = e.getEstado();
        mapper.aplicar(dto, e);
        if (dto.status() != null && !dto.status().equals(antes)) {
            actividad.registrar("Hallazgo " + id + " → " + dto.status(), "cerrado".equals(dto.status()) ? "int" : "neutral");
        }
        return mapper.toDto(e);
    }

    @Override
    public void eliminar(String id) {
        repository.delete(buscar(id));
        actividad.registrar("Hallazgo eliminado: " + id, "danger");
    }

    private Hallazgo buscar(String id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Hallazgo", id));
    }
}
