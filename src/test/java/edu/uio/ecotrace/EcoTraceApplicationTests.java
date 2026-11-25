package edu.uio.ecotrace;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class EcoTraceApplicationTests {

    @Test
    void contextoCargaYMigracionesFlywayValidan() {
        // Si el esquema Flyway no coincide con las entidades JPA (ddl-auto=validate) el contexto falla.
    }
}
