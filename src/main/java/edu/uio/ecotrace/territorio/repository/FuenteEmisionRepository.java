package edu.uio.ecotrace.territorio.repository;

import edu.uio.ecotrace.territorio.model.FuenteEmision;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Acceso a datos de FuenteEmision en PostgreSQL.
 * Spring Data JPA genera la implementación a partir de los nombres de los métodos (reemplaza el JDBC manual del repositorio de referencia: menos código y sin fugas de conexiones).
 *
 * SOLID (D): los servicios dependen de esta interfaz.
 */
public interface FuenteEmisionRepository extends JpaRepository<FuenteEmision, String> {

    List<FuenteEmision> findByZonaId(String zonaId);

    List<FuenteEmision> findBySector(String sector);
}
