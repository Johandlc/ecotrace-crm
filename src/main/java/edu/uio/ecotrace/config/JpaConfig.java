package edu.uio.ecotrace.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Activa JPA Auditing: rellena creado_en / actualizado_en de las entidades que extienden EntidadAuditable.
 */
@Configuration
@EnableJpaAuditing
public class JpaConfig {
}
