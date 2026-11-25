package edu.uio.ecotrace.hallazgo.repository;

import edu.uio.ecotrace.hallazgo.model.Hallazgo;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Acceso a datos de Hallazgo en PostgreSQL.
 * Spring Data JPA genera la implementación a partir de los nombres de los métodos (reemplaza el JDBC manual del repositorio de referencia: menos código y sin fugas de conexiones).
 *
 * SOLID (D): los servicios dependen de esta interfaz.
 */
public interface HallazgoRepository extends JpaRepository<Hallazgo, String> {

    boolean existsByPuntoIdAndParametroAndEstadoNot(String puntoId, String parametro, String estado);

    List<Hallazgo> findAllByOrderByCreadoEnDesc();

    List<Hallazgo> findByPuntoIdIn(List<String> puntoIds);
}
