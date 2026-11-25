package edu.uio.ecotrace.integracion.ingesta.repository;

import edu.uio.ecotrace.integracion.ingesta.model.LoteIngesta;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Acceso a datos de LoteIngesta en PostgreSQL.
 * Spring Data JPA genera la implementación a partir de los nombres de los métodos (reemplaza el JDBC manual del repositorio de referencia: menos código y sin fugas de conexiones).
 *
 * SOLID (D): los servicios dependen de esta interfaz.
 */
public interface LoteIngestaRepository extends JpaRepository<LoteIngesta, String> {

    List<LoteIngesta> findTop50ByOrderByFechaDesc();
}
