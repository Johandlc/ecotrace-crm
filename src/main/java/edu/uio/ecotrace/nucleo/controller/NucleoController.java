package edu.uio.ecotrace.nucleo.controller;

import edu.uio.ecotrace.nucleo.dto.NucleoSnapshotDto;
import edu.uio.ecotrace.nucleo.service.NucleoService;
import edu.uio.ecotrace.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Capa de presentación REST de el snapshot del núcleo de datos (/api/v1/nucleo).
 * Recibe la petición HTTP, valida el DTO con @Valid y delega en NucleoService; no contiene reglas de negocio.
 * Los permisos por rol se aplican en SeguridadConfig (lectura: cualquier usuario; escritura: ADMIN o ANALISTA).
 *
 * SOLID:
 *  - S: su única razón de cambio es el formato de la API.
 *  - D: depende de la interfaz NucleoService, que Spring inyecta por constructor.
 */
@Tag(name = "Núcleo de datos")
@RestController
@RequestMapping("/api/v1/nucleo")
public class NucleoController {

    private final NucleoService service;

    public NucleoController(NucleoService service) {
        this.service = service;
    }

    @Operation(summary = "Snapshot del núcleo: entidades + lecturas de las últimas N horas")
    @GetMapping("/snapshot")
    public ApiResponse<NucleoSnapshotDto> snapshot(@RequestParam(defaultValue = "72") int horas) {
        return ApiResponse.ok(service.snapshot(Math.max(1, Math.min(horas, 1440))));
    }
}
