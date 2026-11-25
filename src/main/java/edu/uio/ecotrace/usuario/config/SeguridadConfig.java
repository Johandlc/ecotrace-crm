package edu.uio.ecotrace.usuario.config;

import edu.uio.ecotrace.usuario.model.Usuario;
import edu.uio.ecotrace.usuario.repository.UsuarioRepository;
import java.time.Instant;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;

/**
 * Composition root de la seguridad (equivale a UsuarioServletConfig del proyecto de referencia).
 *
 * Reglas de acceso:
 *  - Público: login, portada del login, token CSRF, lectura del territorio y Swagger.
 *  - Autenticado (cualquier rol): todas las lecturas GET de /api/**.
 *  - ADMIN o ANALISTA: cualquier escritura (POST, PATCH, PUT, DELETE).
 *  - Sólo ADMIN: /api/v1/usuarios/**.
 *
 * Corrige los problemas del proyecto de referencia: allí /api/clientes no exigía sesión,
 * la sesión no cambiaba de id al autenticarse (fijación de sesión) y no había protección CSRF.
 *
 * SOLID (S/D): aquí sólo se cablea; las reglas de negocio viven en AuthServiceImpl.
 */
@Configuration
@EnableMethodSecurity
public class SeguridadConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, RespuestaSeguridadJson respuestas,
                                                   SecurityContextRepository contexto) throws Exception {
        http.cors(Customizer.withDefaults())
                // CSRF para una SPA: el token viaja en la cookie XSRF-TOKEN y vuelve en la cabecera X-XSRF-TOKEN.
                .csrf(csrf -> csrf.spa())
                .securityContext(sc -> sc.securityContextRepository(contexto))
                .sessionManagement(s -> s.sessionFixation(f -> f.changeSessionId()))
                .headers(h -> h.frameOptions(f -> f.sameOrigin()))
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                // HTTP Basic sólo para clientes de API (curl, scripts); el navegador usa la sesión.
                .httpBasic(b -> b.authenticationEntryPoint(respuestas))
                .exceptionHandling(e -> e.authenticationEntryPoint(respuestas).accessDeniedHandler(respuestas))
                .authorizeHttpRequests(a -> a
                        .requestMatchers("/api/v1/auth/login", "/api/v1/auth/portada", "/api/v1/auth/csrf").permitAll()
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/territorio/**").permitAll()
                        .requestMatchers("/api/v1/usuarios/**").hasRole("ADMIN")
                        .requestMatchers("/api/v1/auth/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/**").authenticated()
                        .requestMatchers("/api/**").hasAnyRole("ADMIN", "ANALISTA")
                        .anyRequest().permitAll()); // archivos estáticos de la SPA
        return http.build();
    }

    /** Guarda el SecurityContext en la sesión HTTP; AuthController lo usa al iniciar sesión. */
    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    /** BCrypt por defecto, con prefijo {bcrypt} para poder migrar de algoritmo en el futuro. */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    /** Carga usuarios para HTTP Basic. El login del navegador pasa por AuthServiceImpl (con bloqueo). */
    @Bean
    public UserDetailsService userDetailsService(UsuarioRepository repository) {
        return username -> {
            Usuario u = repository.findByUsernameIgnoreCase(username)
                    .orElseThrow(() -> new UsernameNotFoundException(username));
            return User.withUsername(u.getUsername()).password(u.getPasswordHash()).roles(u.getRol().name())
                    .disabled(!u.isActivo()).accountLocked(u.estaBloqueado(Instant.now())).build();
        };
    }
}
