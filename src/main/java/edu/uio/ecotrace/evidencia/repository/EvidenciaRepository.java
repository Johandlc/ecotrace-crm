package edu.uio.ecotrace.evidencia.repository;

import edu.uio.ecotrace.evidencia.model.Evidencia;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Acceso a datos de Evidencia en PostgreSQL.
 * Spring Data JPA genera la implementación a partir de los nombres de los métodos (reemplaza el JDBC manual del repositorio de referencia: menos código y sin fugas de conexiones).
 *
 * SOLID (D): los servicios dependen de esta interfaz.
 */
public interface EvidenciaRepository extends JpaRepository<Evidencia, String> {

    List<Evidencia> findByEntidadIdIn(Collection<String> entidadIds);
}
