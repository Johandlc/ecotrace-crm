package edu.uio.ecotrace.evidencia.service;

import edu.uio.ecotrace.cumplimiento.auditoria.service.ActividadService;
import edu.uio.ecotrace.evidencia.dto.EvidenciaDto;
import edu.uio.ecotrace.evidencia.mapper.EvidenciaMapper;
import edu.uio.ecotrace.evidencia.model.Evidencia;
import edu.uio.ecotrace.evidencia.repository.EvidenciaRepository;
import edu.uio.ecotrace.shared.exception.ResourceNotFoundException;
import edu.uio.ecotrace.shared.util.IdGenerator;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementación de EvidenciaService: reglas de negocio de las evidencias documentales.
 * Una evidencia se asocia a un requisito, hallazgo o queja.
 * Usa transacciones (@Transactional) y no sabe nada de HTTP ni de JSON (como el ClienteService del proyecto de referencia).
 */
@Service
@Transactional
public class EvidenciaServiceImpl implements EvidenciaService {

    private final EvidenciaRepository repository;
    private final EvidenciaMapper mapper;
    private final ActividadService actividad;

    public EvidenciaServiceImpl(EvidenciaRepository repository, EvidenciaMapper mapper, ActividadService actividad) {
        this.repository = repository;
        this.mapper = mapper;
        this.actividad = actividad;
    }

    @Transactional(readOnly = true)
    @Override
    public List<EvidenciaDto> listar() {
        return repository.findAll().stream().map(mapper::toDto).toList();
    }

    @Override
    public EvidenciaDto crear(EvidenciaDto dto) {
        Evidencia e = new Evidencia();
        e.setId(IdGenerator.nuevo("E"));
        e.setFecha(Instant.now());
        mapper.aplicar(dto, e);
        actividad.registrar("Evidencia adjuntada a " + e.getEntidadId() + ": " + e.getNombre(), "int");
        return mapper.toDto(repository.save(e));
    }

    @Override
    public EvidenciaDto actualizar(String id, EvidenciaDto dto) {
        Evidencia e = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Evidencia", id));
        mapper.aplicar(dto, e);
        return mapper.toDto(e);
    }

    @Override
    public void eliminar(String id) {
        repository.delete(repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Evidencia", id)));
    }
}
