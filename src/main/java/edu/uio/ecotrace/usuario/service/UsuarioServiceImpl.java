package edu.uio.ecotrace.usuario.service;

import edu.uio.ecotrace.cumplimiento.auditoria.service.ActividadService;
import edu.uio.ecotrace.shared.exception.BusinessException;
import edu.uio.ecotrace.shared.exception.ConflictoException;
import edu.uio.ecotrace.shared.exception.ResourceNotFoundException;
import edu.uio.ecotrace.usuario.dto.UsuarioRequest;
import edu.uio.ecotrace.usuario.dto.UsuarioResponse;
import edu.uio.ecotrace.usuario.dto.UsuarioUpdateRequest;
import edu.uio.ecotrace.usuario.mapper.UsuarioMapper;
import edu.uio.ecotrace.usuario.model.Rol;
import edu.uio.ecotrace.usuario.model.Usuario;
import edu.uio.ecotrace.usuario.repository.UsuarioRepository;
import java.util.Comparator;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Reglas de negocio de la administración de usuarios.
 *
 * - Username y correo únicos (409). La base de datos también lo garantiza con índices únicos:
 *   el "synchronized" del ClienteService de referencia no protegía contra dos instancias.
 * - Siempre debe quedar al menos un ADMIN activo.
 * - Nadie puede desactivarse ni quitarse el rol de administrador a sí mismo.
 */
@Service
@Transactional
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository repository;
    private final PasswordEncoder encoder;
    private final UsuarioMapper mapper;
    private final ActividadService actividad;

    public UsuarioServiceImpl(UsuarioRepository repository, PasswordEncoder encoder, UsuarioMapper mapper, ActividadService actividad) {
        this.repository = repository;
        this.encoder = encoder;
        this.mapper = mapper;
        this.actividad = actividad;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {
        return repository.findAll().stream()
                .sorted(Comparator.comparing(Usuario::getRol).thenComparing(Usuario::getUsername))
                .map(mapper::toResponse).toList();
    }

    @Override
    public UsuarioResponse crear(UsuarioRequest r) {
        if (repository.existsByUsernameIgnoreCase(r.username())) throw new ConflictoException("El usuario '" + r.username() + "' ya existe");
        if (r.correo() != null && !r.correo().isBlank() && repository.existsByCorreoIgnoreCase(r.correo()))
            throw new ConflictoException("Ya existe un usuario con ese correo");
        Usuario u = new Usuario(r.username().trim(), encoder.encode(r.password()), r.nombre().trim(),
                blancoANulo(r.correo()), Rol.valueOf(r.rol()));
        actividad.registrar("Usuario creado: " + u.getUsername() + " (" + u.getRol().descripcion() + ")", "int");
        return mapper.toResponse(repository.save(u));
    }

    @Override
    public UsuarioResponse actualizar(Long id, UsuarioUpdateRequest r, String actor) {
        Usuario u = buscar(id);
        boolean esActor = u.getUsername().equalsIgnoreCase(actor);
        if (r.nombre() != null && !r.nombre().isBlank()) u.setNombreCompleto(r.nombre().trim());
        if (r.correo() != null) {
            if (!r.correo().isBlank() && repository.existsByCorreoIgnoreCaseAndIdNot(r.correo(), id))
                throw new ConflictoException("Ya existe otro usuario con ese correo");
            u.setCorreo(blancoANulo(r.correo()));
        }
        if (r.rol() != null) {
            Rol nuevo = Rol.valueOf(r.rol());
            if (esActor && nuevo != Rol.ADMIN) throw new BusinessException("No puedes quitarte el rol de administrador a ti mismo");
            if (u.getRol() == Rol.ADMIN && nuevo != Rol.ADMIN) exigirOtroAdmin();
            u.setRol(nuevo);
        }
        if (r.activo() != null && !r.activo()) {
            if (esActor) throw new BusinessException("No puedes desactivar tu propia cuenta");
            if (u.getRol() == Rol.ADMIN) exigirOtroAdmin();
            u.setActivo(false);
        } else if (Boolean.TRUE.equals(r.activo())) {
            u.setActivo(true);
        }
        if (r.password() != null && !r.password().isBlank()) {
            u.setPasswordHash(encoder.encode(r.password()));
            actividad.registrar("Contraseña restablecida: " + u.getUsername(), "neutral");
        }
        return mapper.toResponse(u);
    }

    @Override
    public UsuarioResponse desbloquear(Long id) {
        Usuario u = buscar(id);
        u.setBloqueadoHasta(null);
        u.setIntentosFallidos(0);
        actividad.registrar("Cuenta desbloqueada: " + u.getUsername(), "int");
        return mapper.toResponse(u);
    }

    @Override
    public void desactivar(Long id, String actor) {
        actualizar(id, new UsuarioUpdateRequest(null, null, null, false, null), actor);
        actividad.registrar("Usuario desactivado: " + buscar(id).getUsername(), "danger");
    }

    private void exigirOtroAdmin() {
        if (repository.countByRolAndActivoTrue(Rol.ADMIN) <= 1) throw new BusinessException("Debe quedar al menos un administrador activo");
    }

    private Usuario buscar(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Usuario", id));
    }

    private static String blancoANulo(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
