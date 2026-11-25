package edu.uio.ecotrace.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Documentación OpenAPI (Swagger UI en /swagger-ui.html).
 * Declara HTTP Basic para que se pueda probar la API desde Swagger con un usuario del CRM.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI ecoTraceOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("EcoTrace CRM — API interna")
                        .version("0.1.0")
                        .description("Gestión ambiental: fuentes internas y externas, integración y validación, "
                                + "núcleo de datos, cumplimiento, monitoreo, hallazgos, relaciones, territorio (Quito) y reportes.")
                        .contact(new Contact().name("EcoTrace"))
                        .license(new License().name("Datos de mapa © OpenStreetMap contributors (ODbL)")))
                .components(new Components().addSecuritySchemes("basic",
                        new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("basic")))
                .addSecurityItem(new SecurityRequirement().addList("basic"));
    }
}
