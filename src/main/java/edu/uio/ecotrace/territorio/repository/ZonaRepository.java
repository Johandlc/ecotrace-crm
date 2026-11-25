package edu.uio.ecotrace.territorio.repository;

import edu.uio.ecotrace.territorio.model.Zona;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Acceso a datos de Zona en PostgreSQL.
 * Spring Data JPA genera la implementación a partir de los nombres de los métodos (reemplaza el JDBC manual del repositorio de referencia: menos código y sin fugas de conexiones).
 *
 * SOLID (D): los servicios dependen de esta interfaz.
 */
public interface ZonaRepository extends JpaRepository<Zona, String> {
}
