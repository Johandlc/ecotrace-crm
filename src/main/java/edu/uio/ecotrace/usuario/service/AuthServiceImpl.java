package edu.uio.ecotrace.usuario.service;

import edu.uio.ecotrace.cumplimiento.auditoria.service.ActividadService;
import edu.uio.ecotrace.territorio.service.DatosReferenciaService;
import edu.uio.ecotrace.usuario.config.SeguridadProperties;
import edu.uio.ecotrace.usuario.config.UsuariosIniciales;
import edu.uio.ecotrace.usuario.dto.CuentaDemoDto;
import edu.uio.ecotrace.usuario.dto.PortadaResponse;
import edu.uio.ecotrace.usuario.dto.SesionResponse;
import edu.uio.ecotrace.usuario.exception.CredencialesInvalidasException;
import edu.uio.ecotrace.usuario.exception.CuentaBloqueadaException;
import edu.uio.ecotrace.usuario.mapper.UsuarioMapper;
import edu.uio.ecotrace.usuario.model.UsuarioAutenticado;
import edu.uio.ecotrace.usuario.model.Usuario;
import edu.uio.ecotrace.usuario.repository.UsuarioRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;

/**
 * Implementación de AuthService con PostgreSQL + BCrypt.
 *
 * Correcciones respecto al AuthService de referencia:
 *  - Compara con PasswordEncoder (BCrypt) en vez de String.equals sobre texto plano.
 *  - Bloquea la cuenta tras N intentos fallidos (fuerza bruta).
 *  - Cuando el usuario no existe igual ejecuta un "matches" de cartón para que el tiempo de
 *    respuesta no delate qué usuarios existen.
 *  - Registra inicios, fallos y bloqueos en la pista de auditoría.
 */
@Service
public class AuthServiceImpl implements AuthService {


    private final UsuarioRepository repository;
    private final PasswordEncoder encoder;
    private final UsuarioMapper mapper;
    private final SeguridadProperties props;
    private final ActividadService actividad;
    private final DatosReferenciaService datos;
    /** Hash de una clave aleatoria: sólo sirve para igualar tiempos cuando el usuario no existe. */
    private final String hashFicticio;

    public AuthServiceImpl(UsuarioRepository repository, PasswordEncoder encoder, UsuarioMapper mapper,
                           SeguridadProperties props, ActividadService actividad, DatosReferenciaService datos) {
        this.repository = repository;
        this.encoder = encoder;
        this.mapper = mapper;
        this.props = props;
        this.actividad = actividad;
        this.datos = datos;
        this.hashFicticio = encoder.encode(UUID.randomUUID().toString());
    }

    @Override
    // noRollbackFor: el contador de intentos debe guardarse aunque se lance la excepción.
    @Transactional(noRollbackFor = {CredencialesInvalidasException.class, CuentaBloqueadaException.class})
    public ResultadoAutenticacion autenticar(String username, String password) {
        Instant ahora = Instant.now();
        Usuario u = repository.findByUsernameIgnoreCase(username.trim()).orElse(null);
        if (u == null) {
            encoder.matches(password, hashFicticio);
            throw new CredencialesInvalidasException(null);
        }
        if (!u.isActivo()) {
            throw new CuentaBloqueadaException("La cuenta está desactivada. Contacta a un administrador.", null);
        }
        if (u.estaBloqueado(ahora)) {
            throw new CuentaBloqueadaException("Cuenta bloqueada temporalmente por intentos fallidos.", u.getBloqueadoHasta());
        }
        if (!encoder.matches(password, u.getPasswordHash())) {
            int intentos = u.getIntentosFallidos() + 1;
            if (intentos >= props.maxIntentos()) {
                u.setIntentosFallidos(0);
                u.setBloqueadoHasta(ahora.plus(Duration.ofMinutes(props.minutosBloqueo())));
                actividad.registrar("Cuenta bloqueada por intentos fallidos: " + u.getUsername(), "danger", u.getUsername());
                throw new CuentaBloqueadaException("Demasiados intentos. Cuenta bloqueada " + props.minutosBloqueo() + " minutos.", u.getBloqueadoHasta());
            }
            u.setIntentosFallidos(intentos);
            throw new CredencialesInvalidasException(props.maxIntentos() - intentos);
        }
        // Éxito: se reinicia el contador y se actualiza el hash si el algoritmo quedó obsoleto.
        if (encoder.upgradeEncoding(u.getPasswordHash())) u.setPasswordHash(encoder.encode(password));
        Instant anterior = u.getUltimoAcceso();
        u.setIntentosFallidos(0);
        u.setBloqueadoHasta(null);
        u.setUltimoAcceso(ahora);
        actividad.registrar("Inicio de sesión: " + u.getNombreCompleto() + " (" + u.getRol().descripcion() + ")", "int", u.getUsername());
        return new ResultadoAutenticacion(UsuarioAutenticado.de(u), mapper.toSesion(u, anterior));
    }

    @Override
    @Transactional(readOnly = true)
    public SesionResponse sesion(String username) {
        Usuario u = repository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new CredencialesInvalidasException(null));
        return mapper.toSesion(u, u.getUltimoAcceso());
    }

    @Override
    public PortadaResponse portada() {
        Long ultimo = null;
        Double pm25 = null;
        Integer estaciones = null;
        try {
            // Dato real para la portada: promedio del último día publicado de PM2.5 en la REMMAQ.
            JsonNode r = datos.dataset("remmaq");
            ultimo = r.path("meta").path("lastTs").asLong();
            double suma = 0;
            int n = 0;
            for (JsonNode serie : r.path("daily").path("pm2_5")) {
                JsonNode ultimoDia = serie.get(serie.size() - 1);
                if (ultimoDia != null && ultimoDia.get(1).isNumber()) {
                    suma += ultimoDia.get(1).asDouble();
                    n++;
                }
            }
            if (n > 0) {
                pm25 = Math.round(suma / n * 10) / 10.0;
                estaciones = n;
            }
        } catch (RuntimeException e) {
            // La portada no debe fallar si el dataset no está disponible.
        }
        List<CuentaDemoDto> demo = new ArrayList<>();
        if (props.cuentasDemo()) {
            demo.add(new CuentaDemoDto(props.admin().usuario(), props.admin().password(), "ADMIN", "Todo, incluida la gestión de usuarios"));
            demo.add(new CuentaDemoDto(UsuariosIniciales.ANALISTA, UsuariosIniciales.CLAVE_ANALISTA, "ANALISTA", "Registra monitoreos, hallazgos y quejas"));
            demo.add(new CuentaDemoDto(UsuariosIniciales.LECTOR, UsuariosIniciales.CLAVE_LECTOR, "LECTOR", "Sólo consulta tableros y reportes"));
        }
        return new PortadaResponse(ultimo, pm25, estaciones, demo);
    }

    @Override
    public void registrarCierre(String username) {
        actividad.registrar("Cierre de sesión: " + username, "neutral", username);
    }
}
