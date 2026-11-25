package edu.uio.ecotrace.cumplimiento.auditoria.controller;

import edu.uio.ecotrace.cumplimiento.auditoria.dto.ActividadDto;
import edu.uio.ecotrace.cumplimiento.auditoria.service.ActividadService;
import edu.uio.ecotrace.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Capa de presentación REST de la pista de auditoría (actividad) (/api/v1/auditoria).
 * Recibe la petición HTTP, valida el DTO con @Valid y delega en ActividadService; no contiene reglas de negocio.
 * Los permisos por rol se aplican en SeguridadConfig (lectura: cualquier usuario; escritura: ADMIN o ANALISTA).
 *
 * SOLID:
 *  - S: su única razón de cambio es el formato de la API.
 *  - D: depende de la interfaz ActividadService, que Spring inyecta por constructor.
 */
@Tag(name = "Auditoría")
@RestController
@RequestMapping("/api/v1/auditoria")
public class ActividadController {

    private final ActividadService service;

    public ActividadController(ActividadService service) {
        this.service = service;
    }

    @GetMapping("/actividad")
    public ApiResponse<List<ActividadDto>> actividad() {
        return ApiResponse.ok(service.recientes());
    }
}
