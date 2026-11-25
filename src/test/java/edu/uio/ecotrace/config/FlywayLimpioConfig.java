package edu.uio.ecotrace.config;

import org.springframework.boot.flyway.autoconfigure.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Sólo en pruebas: deja la base ecotrace_test vacía y vuelve a migrar antes de cada ejecución,
 * para que las pruebas no dependan de datos de corridas anteriores.
 */
@Configuration
@Profile("test")
public class FlywayLimpioConfig {

    @Bean
    public FlywayMigrationStrategy limpiarYMigrar() {
        return flyway -> {
            flyway.clean();
            flyway.migrate();
        };
    }
}
