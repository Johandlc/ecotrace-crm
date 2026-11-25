package edu.uio.ecotrace.puntomonitoreo.service;

import edu.uio.ecotrace.cumplimiento.auditoria.service.ActividadService;
import edu.uio.ecotrace.puntomonitoreo.dto.PuntoMonitoreoDto;
import edu.uio.ecotrace.puntomonitoreo.mapper.PuntoMonitoreoMapper;
import edu.uio.ecotrace.puntomonitoreo.model.PuntoMonitoreo;
import edu.uio.ecotrace.puntomonitoreo.repository.PuntoMonitoreoRepository;
import edu.uio.ecotrace.shared.exception.ResourceNotFoundException;
import edu.uio.ecotrace.shared.util.IdGenerator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementación de PuntoMonitoreoService: reglas de negocio de los puntos de monitoreo (estaciones REMMAQ y puntos propios).
 * Usa transacciones (@Transactional) y no sabe nada de HTTP ni de JSON (como el ClienteService del proyecto de referencia).
 */
@Service
@Transactional
public class PuntoMonitoreoServiceImpl implements PuntoMonitoreoService {

    private final PuntoMonitoreoRepository repository;
    private final PuntoMonitoreoMapper mapper;
    private final ActividadService actividad;

    public PuntoMonitoreoServiceImpl(PuntoMonitoreoRepository repository, PuntoMonitoreoMapper mapper, ActividadService actividad) {
        this.repository = repository;
        this.mapper = mapper;
        this.actividad = actividad;
    }

    @Transactional(readOnly = true)
    @Override
    public List<PuntoMonitoreoDto> listar() {
        return repository.findAll().stream().map(mapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    @Override
    public PuntoMonitoreoDto obtener(String id) {
        return mapper.toDto(buscar(id));
    }

    @Override
    public PuntoMonitoreoDto crear(PuntoMonitoreoDto dto) {
        PuntoMonitoreo e = new PuntoMonitoreo();
        e.setId(IdGenerator.nuevo("P"));
        mapper.aplicar(dto, e);
        actividad.registrar("Punto de monitoreo registrado: " + e.getNombre(), "int");
        return mapper.toDto(repository.save(e));
    }

    @Override
    public PuntoMonitoreoDto actualizar(String id, PuntoMonitoreoDto dto) {
        PuntoMonitoreo e = buscar(id);
        mapper.aplicar(dto, e);
        return mapper.toDto(e);
    }

    @Override
    public void eliminar(String id) {
        PuntoMonitoreo e = buscar(id);
        repository.delete(e);
        actividad.registrar("Punto de monitoreo eliminado: " + e.getNombre(), "danger");
    }

    private PuntoMonitoreo buscar(String id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Punto de monitoreo", id));
    }
}
