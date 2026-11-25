package edu.uio.ecotrace;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Punto de entrada de EcoTrace CRM (Spring Boot 4).
 *
 * @ConfigurationPropertiesScan registra los records de configuración (SeguridadProperties, ExternaProperties).
 * La aplicación es un monolito modular "package by feature": cada módulo (usuario, monitoreo, hallazgo…)
 * agrupa su controller, service, repository, model, dto y mapper, igual que el repositorio de referencia.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class EcoTraceApplication {

    public static void main(String[] args) {
        SpringApplication.run(EcoTraceApplication.class, args);
    }
}
