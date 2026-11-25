package edu.uio.ecotrace.cumplimiento.auditoria.service;

import edu.uio.ecotrace.cumplimiento.auditoria.dto.ActividadDto;
import edu.uio.ecotrace.cumplimiento.auditoria.model.Actividad;
import edu.uio.ecotrace.cumplimiento.auditoria.repository.ActividadRepository;
import edu.uio.ecotrace.shared.util.IdGenerator;
import java.time.Instant;
import java.util.List;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementación de ActividadService: reglas de negocio de la pista de auditoría (actividad).
 * Cada cambio relevante del núcleo queda registrado con su usuario.
 * Usa transacciones (@Transactional) y no sabe nada de HTTP ni de JSON (como el ClienteService del proyecto de referencia).
 */
@Service
public class ActividadServiceImpl implements ActividadService {

    private final ActividadRepository repository;

    public ActividadServiceImpl(ActividadRepository repository) {
        this.repository = repository;
    }

    @Transactional
    @Override
    public void registrar(String texto, String tono) {
        registrar(texto, tono, usuarioActual());
    }

    @Override
    @Transactional
    public void registrar(String texto, String tono, String usuario) {
        Actividad a = new Actividad();
        a.setId(IdGenerator.nuevo("A"));
        a.setFecha(Instant.now());
        a.setTexto(texto.length() > 400 ? texto.substring(0, 400) : texto);
        a.setTono(tono);
        a.setUsuario(usuario);
        repository.save(a);
    }

    @Transactional(readOnly = true)
    @Override
    public List<ActividadDto> recientes() {
        return repository.findTop100ByOrderByFechaDesc().stream()
                .map(a -> new ActividadDto(a.getId(), a.getFecha().toEpochMilli(), a.getTexto(), a.getTono(), a.getUsuario()))
                .toList();
    }

    /** Usuario autenticado en el hilo actual, o "sistema" (arranque, tareas automáticas). */
    private static String usuarioActual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken ? "sistema" : auth.getName();
    }
}
