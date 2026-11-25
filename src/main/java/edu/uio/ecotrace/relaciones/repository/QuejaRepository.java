package edu.uio.ecotrace.relaciones.repository;

import edu.uio.ecotrace.relaciones.model.Queja;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Acceso a datos de Queja en PostgreSQL.
 * Spring Data JPA genera la implementación a partir de los nombres de los métodos (reemplaza el JDBC manual del repositorio de referencia: menos código y sin fugas de conexiones).
 *
 * SOLID (D): los servicios dependen de esta interfaz.
 */
public interface QuejaRepository extends JpaRepository<Queja, String> {

    List<Queja> findAllByOrderByFechaDesc();
}
