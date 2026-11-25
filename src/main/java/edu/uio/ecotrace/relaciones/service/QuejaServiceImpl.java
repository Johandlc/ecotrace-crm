package edu.uio.ecotrace.relaciones.service;

import edu.uio.ecotrace.cumplimiento.auditoria.service.ActividadService;
import edu.uio.ecotrace.relaciones.dto.QuejaDto;
import edu.uio.ecotrace.relaciones.mapper.QuejaMapper;
import edu.uio.ecotrace.relaciones.model.Queja;
import edu.uio.ecotrace.relaciones.repository.QuejaRepository;
import edu.uio.ecotrace.shared.exception.ResourceNotFoundException;
import edu.uio.ecotrace.shared.util.IdGenerator;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementación de QuejaService: reglas de negocio de las quejas y solicitudes de partes interesadas.
 * Una queja pasa por abierta → en gestión → cerrada.
 * Usa transacciones (@Transactional) y no sabe nada de HTTP ni de JSON (como el ClienteService del proyecto de referencia).
 */
@Service
@Transactional
public class QuejaServiceImpl implements QuejaService {

    private final QuejaRepository repository;
    private final QuejaMapper mapper;
    private final ActividadService actividad;

    public QuejaServiceImpl(QuejaRepository repository, QuejaMapper mapper, ActividadService actividad) {
        this.repository = repository;
        this.mapper = mapper;
        this.actividad = actividad;
    }

    @Transactional(readOnly = true)
    @Override
    public List<QuejaDto> listar() {
        return repository.findAllByOrderByFechaDesc().stream().map(mapper::toDto).toList();
    }

    @Override
    public QuejaDto crear(QuejaDto dto) {
        Queja e = new Queja();
        e.setId(IdGenerator.nuevo("C"));
        e.setCanal("portal");
        e.setEstado("abierta");
        e.setFecha(Instant.now());
        mapper.aplicar(dto, e);
        actividad.registrar("Queja recibida: " + e.getAsunto(), "ext");
        return mapper.toDto(repository.save(e));
    }

    @Override
    public QuejaDto actualizar(String id, QuejaDto dto) {
        Queja e = buscar(id);
        mapper.aplicar(dto, e);
        if (dto.status() != null) actividad.registrar("Queja " + id + ": " + dto.status(), "ext");
        return mapper.toDto(e);
    }

    @Override
    public void eliminar(String id) {
        repository.delete(buscar(id));
    }

    private Queja buscar(String id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Queja", id));
    }
}
