package edu.uio.ecotrace.parteinteresada.repository;

import edu.uio.ecotrace.parteinteresada.model.ParteInteresada;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Acceso a datos de ParteInteresada en PostgreSQL.
 * Spring Data JPA genera la implementación a partir de los nombres de los métodos (reemplaza el JDBC manual del repositorio de referencia: menos código y sin fugas de conexiones).
 *
 * SOLID (D): los servicios dependen de esta interfaz.
 */
public interface ParteInteresadaRepository extends JpaRepository<ParteInteresada, String> {
}
