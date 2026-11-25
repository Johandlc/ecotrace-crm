package edu.uio.ecotrace.puntomonitoreo.repository;

import edu.uio.ecotrace.puntomonitoreo.model.PuntoMonitoreo;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Acceso a datos de PuntoMonitoreo en PostgreSQL.
 * Spring Data JPA genera la implementación a partir de los nombres de los métodos (reemplaza el JDBC manual del repositorio de referencia: menos código y sin fugas de conexiones).
 *
 * SOLID (D): los servicios dependen de esta interfaz.
 */
public interface PuntoMonitoreoRepository extends JpaRepository<PuntoMonitoreo, String> {

    List<PuntoMonitoreo> findByMedio(String medio);
}
