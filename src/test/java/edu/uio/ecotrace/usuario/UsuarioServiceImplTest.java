package edu.uio.ecotrace.usuario;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import edu.uio.ecotrace.cumplimiento.auditoria.service.ActividadService;
import edu.uio.ecotrace.shared.exception.BusinessException;
import edu.uio.ecotrace.usuario.dto.UsuarioUpdateRequest;
import edu.uio.ecotrace.usuario.mapper.UsuarioMapper;
import edu.uio.ecotrace.usuario.model.Rol;
import edu.uio.ecotrace.usuario.model.Usuario;
import edu.uio.ecotrace.usuario.repository.UsuarioRepository;
import edu.uio.ecotrace.usuario.service.UsuarioServiceImpl;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;

/**
 * Prueba unitaria (sin base de datos): las reglas de negocio se verifican con un repositorio simulado.
 * Es posible porque UsuarioServiceImpl depende de interfaces (SOLID D).
 */
class UsuarioServiceImplTest {

    private final UsuarioRepository repo = mock(UsuarioRepository.class);
    private final UsuarioServiceImpl service = new UsuarioServiceImpl(repo, PasswordEncoderFactories.createDelegatingPasswordEncoder(),
            new UsuarioMapper(), mock(ActividadService.class));

    private Usuario admin(String username) {
        return new Usuario(username, "{noop}x", "Admin " + username, null, Rol.ADMIN);
    }

    @Test
    void noSePuedeDegradarAlUltimoAdministrador() {
        when(repo.findById(1L)).thenReturn(Optional.of(admin("jefa")));
        when(repo.countByRolAndActivoTrue(Rol.ADMIN)).thenReturn(1L);
        assertThatThrownBy(() -> service.actualizar(1L, new UsuarioUpdateRequest(null, null, "LECTOR", null, null), "otro"))
                .isInstanceOf(BusinessException.class).hasMessageContaining("al menos un administrador");
    }

    @Test
    void nadiePuedeDesactivarseASiMismo() {
        when(repo.findById(2L)).thenReturn(Optional.of(admin("yo")));
        when(repo.countByRolAndActivoTrue(Rol.ADMIN)).thenReturn(3L);
        assertThatThrownBy(() -> service.desactivar(2L, "YO"))
                .isInstanceOf(BusinessException.class).hasMessageContaining("propia cuenta");
    }
}
