package edu.uio.ecotrace.monitoreo.repository;

import edu.uio.ecotrace.monitoreo.model.Lectura;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * Acceso a datos de Lectura en PostgreSQL.
 * Spring Data JPA genera la implementación a partir de los nombres de los métodos (reemplaza el JDBC manual del repositorio de referencia: menos código y sin fugas de conexiones).
 *
 * SOLID (D): los servicios dependen de esta interfaz.
 */
public interface LecturaRepository extends JpaRepository<Lectura, String> {

    List<Lectura> findByFechaMedicionAfterOrderByFechaMedicionAsc(Instant desde);

    /** Última fecha disponible de un canal (la REMMAQ publica con semanas de rezago). */
    @Query("select max(l.fechaMedicion) from Lectura l where l.canal = ?1")
    Instant ultimaFechaDeCanal(String canal);

    List<Lectura> findByCanalAndFechaMedicionAfterOrderByFechaMedicionAsc(String canal, Instant desde);

    List<Lectura> findByPuntoIdAndFechaMedicionAfterOrderByFechaMedicionAsc(String puntoId, Instant desde);

    List<Lectura> findByPuntoIdAndParametroAndFechaMedicionAfterOrderByFechaMedicionAsc(String puntoId, String parametro, Instant desde);

    List<Lectura> findByPuntoIdInAndFechaMedicionAfter(List<String> puntoIds, Instant desde);

    /** Claves existentes "punto|parametro|epochMillis" en una ventana, para detectar duplicados en bloque. */
    @Query("select l.puntoId, l.parametro, l.fechaMedicion from Lectura l where l.fechaMedicion between ?1 and ?2")
    List<Object[]> clavesEntre(Instant desde, Instant hasta);
}
