package edu.uio.ecotrace.monitoreo.controller;

import edu.uio.ecotrace.monitoreo.dto.LecturaDto;
import edu.uio.ecotrace.monitoreo.dto.ParametroDto;
import edu.uio.ecotrace.monitoreo.service.MonitoreoService;
import edu.uio.ecotrace.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Capa de presentación REST de las lecturas validadas de monitoreo (/api/v1/monitoreo).
 * Recibe la petición HTTP, valida el DTO con @Valid y delega en MonitoreoService; no contiene reglas de negocio.
 * Los permisos por rol se aplican en SeguridadConfig (lectura: cualquier usuario; escritura: ADMIN o ANALISTA).
 *
 * SOLID:
 *  - S: su única razón de cambio es el formato de la API.
 *  - D: depende de la interfaz MonitoreoService, que Spring inyecta por constructor.
 */
@Tag(name = "Monitoreo")
@RestController
@RequestMapping("/api/v1/monitoreo")
public class MonitoreoController {

    private final MonitoreoService service;

    public MonitoreoController(MonitoreoService service) {
        this.service = service;
    }

    @Operation(summary = "Lecturas validadas (las lecturas entran sólo por /api/integracion/ingesta)")
    @GetMapping("/lecturas")
    public ApiResponse<List<LecturaDto>> lecturas(@RequestParam(required = false) String puntoId,
                                                  @RequestParam(required = false) String parametro,
                                                  @RequestParam(defaultValue = "48") int horas) {
        return ApiResponse.ok(service.lecturas(puntoId, parametro, horas));
    }

    @Operation(summary = "Catálogo de parámetros y límites")
    @GetMapping("/parametros")
    public ApiResponse<List<ParametroDto>> parametros() {
        return ApiResponse.ok(service.catalogo());
    }
}
