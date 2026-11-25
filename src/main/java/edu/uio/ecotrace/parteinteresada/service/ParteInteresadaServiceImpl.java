package edu.uio.ecotrace.parteinteresada.service;

import edu.uio.ecotrace.cumplimiento.auditoria.service.ActividadService;
import edu.uio.ecotrace.parteinteresada.dto.ParteInteresadaDto;
import edu.uio.ecotrace.parteinteresada.mapper.ParteInteresadaMapper;
import edu.uio.ecotrace.parteinteresada.model.ParteInteresada;
import edu.uio.ecotrace.parteinteresada.repository.ParteInteresadaRepository;
import edu.uio.ecotrace.shared.exception.ResourceNotFoundException;
import edu.uio.ecotrace.shared.util.IdGenerator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementación de ParteInteresadaService: reglas de negocio de las partes interesadas (autoridades, comunidad, laboratorios, auditores).
 * Usa transacciones (@Transactional) y no sabe nada de HTTP ni de JSON (como el ClienteService del proyecto de referencia).
 */
@Service
@Transactional
public class ParteInteresadaServiceImpl implements ParteInteresadaService {

    private final ParteInteresadaRepository repository;
    private final ParteInteresadaMapper mapper;
    private final ActividadService actividad;

    public ParteInteresadaServiceImpl(ParteInteresadaRepository repository, ParteInteresadaMapper mapper, ActividadService actividad) {
        this.repository = repository;
        this.mapper = mapper;
        this.actividad = actividad;
    }

    @Transactional(readOnly = true)
    @Override
    public List<ParteInteresadaDto> listar() {
        return repository.findAll().stream().map(mapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public ParteInteresadaDto obtener(String id) {
        return mapper.toDto(buscar(id));
    }

    @Override
    public ParteInteresadaDto crear(ParteInteresadaDto dto) {
        ParteInteresada e = new ParteInteresada();
        e.setId(IdGenerator.nuevo("S"));
        mapper.aplicar(dto, e);
        if (e.getInfluencia() == null) e.setInfluencia(3);
        if (e.getPercepcion() == null) e.setPercepcion("neutral");
        actividad.registrar("Parte interesada registrada: " + e.getNombre(), "int");
        return mapper.toDto(repository.save(e));
    }

    @Override
    public ParteInteresadaDto actualizar(String id, ParteInteresadaDto dto) {
        ParteInteresada e = buscar(id);
        mapper.aplicar(dto, e);
        return mapper.toDto(e);
    }

    @Override
    public void eliminar(String id) {
        ParteInteresada e = buscar(id);
        repository.delete(e);
        actividad.registrar("Parte interesada eliminada: " + e.getNombre(), "danger");
    }

    private ParteInteresada buscar(String id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Parte interesada", id));
    }
}
