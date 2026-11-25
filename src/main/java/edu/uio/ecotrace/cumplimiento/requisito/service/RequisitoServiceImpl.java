package edu.uio.ecotrace.cumplimiento.requisito.service;

import edu.uio.ecotrace.cumplimiento.auditoria.service.ActividadService;
import edu.uio.ecotrace.cumplimiento.requisito.dto.RequisitoDto;
import edu.uio.ecotrace.cumplimiento.requisito.mapper.RequisitoMapper;
import edu.uio.ecotrace.cumplimiento.requisito.model.Requisito;
import edu.uio.ecotrace.cumplimiento.requisito.repository.RequisitoRepository;
import edu.uio.ecotrace.shared.exception.ResourceNotFoundException;
import edu.uio.ecotrace.shared.util.IdGenerator;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementación de RequisitoService: reglas de negocio de los requisitos de cumplimiento (permisos y normas).
 * El estado (vigente / por vencer / vencido) se deriva de la fecha con EstadoRequisitoRule.
 * Usa transacciones (@Transactional) y no sabe nada de HTTP ni de JSON (como el ClienteService del proyecto de referencia).
 */
@Service
@Transactional
public class RequisitoServiceImpl implements RequisitoService {

    private final RequisitoRepository repository;
    private final RequisitoMapper mapper;
    private final ActividadService actividad;

    public RequisitoServiceImpl(RequisitoRepository repository, RequisitoMapper mapper, ActividadService actividad) {
        this.repository = repository;
        this.mapper = mapper;
        this.actividad = actividad;
    }

    @Transactional(readOnly = true)
    @Override
    public List<RequisitoDto> listar() {
        return repository.findAll().stream()
                .sorted(Comparator.comparing(Requisito::getVence, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(mapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public RequisitoDto obtener(String id) {
        return mapper.toDto(buscar(id));
    }

    @Transactional(readOnly = true)
    @Override
    public Requisito entidad(String id) {
        return buscar(id);
    }

    @Override
    public RequisitoDto crear(RequisitoDto dto) {
        Requisito e = new Requisito();
        e.setId(IdGenerator.nuevo("Q"));
        mapper.aplicar(dto, e);
        actividad.registrar("Requisito registrado: " + e.getTitulo(), "int");
        return mapper.toDto(repository.save(e));
    }

    @Override
    public RequisitoDto actualizar(String id, RequisitoDto dto) {
        Requisito e = buscar(id);
        mapper.aplicar(dto, e);
        if (dto.expires() != null) actividad.registrar("Vigencia actualizada: " + e.getTitulo(), "int");
        return mapper.toDto(e);
    }

    @Override
    public void eliminar(String id) {
        repository.delete(buscar(id));
        actividad.registrar("Requisito eliminado: " + id, "danger");
    }

    private Requisito buscar(String id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Requisito", id));
    }
}
