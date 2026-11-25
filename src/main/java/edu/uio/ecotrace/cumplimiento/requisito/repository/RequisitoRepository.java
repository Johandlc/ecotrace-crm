package edu.uio.ecotrace.cumplimiento.requisito.repository;

import edu.uio.ecotrace.cumplimiento.requisito.model.Requisito;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Acceso a datos de Requisito en PostgreSQL.
 * Spring Data JPA genera la implementación a partir de los nombres de los métodos (reemplaza el JDBC manual del repositorio de referencia: menos código y sin fugas de conexiones).
 *
 * SOLID (D): los servicios dependen de esta interfaz.
 */
public interface RequisitoRepository extends JpaRepository<Requisito, String> {
}
