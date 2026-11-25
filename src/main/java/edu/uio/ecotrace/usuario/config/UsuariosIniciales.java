package edu.uio.ecotrace.usuario.config;

import edu.uio.ecotrace.usuario.model.Rol;
import edu.uio.ecotrace.usuario.model.Usuario;
import edu.uio.ecotrace.usuario.repository.UsuarioRepository;
import java.security.SecureRandom;
import java.util.Base64;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Crea los usuarios iniciales cuando la tabla está vacía (primer arranque).
 *
 * En el proyecto de referencia los usuarios estaban "quemados" en UsuarioServletConfig con la clave
 * en texto plano. Aquí:
 *  - El administrador toma su clave de ECOTRACE_ADMIN_PASSWORD; si no existe, se genera una aleatoria
 *    y se muestra una sola vez en el log.
 *  - Las cuentas de demostración sólo existen con ecotrace.seguridad.cuentas-demo=true (perfil dev).
 *
 * Conexión: Spring lo ejecuta al arrancar (ApplicationRunner, antes que la carga de datos demo).
 */
@Component
@Order(0)
public class UsuariosIniciales implements ApplicationRunner {

    public static final String ANALISTA = "analista";
    public static final String CLAVE_ANALISTA = "Analista123!";
    public static final String LECTOR = "lector";
    public static final String CLAVE_LECTOR = "Lector123!";

    private static final Logger log = LoggerFactory.getLogger(UsuariosIniciales.class);

    private final UsuarioRepository repository;
    private final PasswordEncoder encoder;
    private final SeguridadProperties props;

    public UsuariosIniciales(UsuarioRepository repository, PasswordEncoder encoder, SeguridadProperties props) {
        this.repository = repository;
        this.encoder = encoder;
        this.props = props;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (repository.count() > 0) return;
        String clave = props.admin().password();
        if (clave == null || clave.isBlank()) {
            byte[] b = new byte[12];
            new SecureRandom().nextBytes(b);
            clave = Base64.getUrlEncoder().withoutPadding().encodeToString(b);
            log.warn("Administrador inicial '{}' creado con clave generada: {}  (cámbiala al ingresar)", props.admin().usuario(), clave);
        }
        repository.save(new Usuario(props.admin().usuario(), encoder.encode(clave), "Administración EcoTrace", null, Rol.ADMIN));
        if (props.cuentasDemo()) {
            repository.save(new Usuario(ANALISTA, encoder.encode(CLAVE_ANALISTA), "Analista ambiental (demo)", null, Rol.ANALISTA));
            repository.save(new Usuario(LECTOR, encoder.encode(CLAVE_LECTOR), "Lector de reportes (demo)", null, Rol.LECTOR));
            log.info("Cuentas de demostración creadas: {}, {}, {}", props.admin().usuario(), ANALISTA, LECTOR);
        }
    }
}
