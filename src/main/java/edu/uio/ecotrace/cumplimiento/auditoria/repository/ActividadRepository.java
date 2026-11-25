package edu.uio.ecotrace.cumplimiento.auditoria.repository;

import edu.uio.ecotrace.cumplimiento.auditoria.model.Actividad;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Acceso a datos de Actividad en PostgreSQL.
 * Spring Data JPA genera la implementación a partir de los nombres de los métodos (reemplaza el JDBC manual del repositorio de referencia: menos código y sin fugas de conexiones).
 *
 * SOLID (D): los servicios dependen de esta interfaz.
 */
public interface ActividadRepository extends JpaRepository<Actividad, String> {

    List<Actividad> findTop100ByOrderByFechaDesc();
}
