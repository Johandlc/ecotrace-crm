package edu.uio.ecotrace.usuario.repository;

import edu.uio.ecotrace.usuario.model.Rol;
import edu.uio.ecotrace.usuario.model.Usuario;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Acceso a datos de usuarios (Spring Data JPA genera la implementación en tiempo de ejecución).
 *
 * Conexión: AuthServiceImpl y UsuarioServiceImpl dependen de esta interfaz, nunca de una clase
 * concreta. Sustituye a InMemoryUsuarioRepository del proyecto de referencia.
 *
 * SOLID:
 *  - D: los servicios dependen de la abstracción.
 *  - I: expone sólo las consultas que el módulo necesita, además del CRUD heredado.
 */
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    /** Búsqueda sin distinguir mayúsculas, coherente con el índice único LOWER(username). */
    Optional<Usuario> findByUsernameIgnoreCase(String username);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByCorreoIgnoreCaseAndIdNot(String correo, Long id);

    boolean existsByCorreoIgnoreCase(String correo);

    /** Para impedir que el sistema se quede sin administradores activos. */
    long countByRolAndActivoTrue(Rol rol);
}
