package edu.uio.ecotrace.integracion.ingesta.controller;

import edu.uio.ecotrace.integracion.ingesta.dto.LoteIngestaDto;
import edu.uio.ecotrace.integracion.ingesta.dto.ResultadoIngestaDto;
import edu.uio.ecotrace.integracion.ingesta.dto.SolicitudIngestaDto;
import edu.uio.ecotrace.integracion.ingesta.service.IngestaService;
import edu.uio.ecotrace.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;

/**
 * Capa de presentación REST de la capa de integración y validación (/api/v1/integracion).
 * Recibe la petición HTTP, valida el DTO con @Valid y delega en IngestaService; no contiene reglas de negocio.
 * Los permisos por rol se aplican en SeguridadConfig (lectura: cualquier usuario; escritura: ADMIN o ANALISTA).
 *
 * SOLID:
 *  - S: su única razón de cambio es el formato de la API.
 *  - D: depende de la interfaz IngestaService, que Spring inyecta por constructor.
 */
@Tag(name = "Integración y validación")
@RestController
@RequestMapping("/api/v1/integracion")
public class IngestaController {

    private final IngestaService service;

    public IngestaController(IngestaService service) {
        this.service = service;
    }

    @Operation(summary = "Ingresa un lote (sensores, formularios, laboratorio, APIs) y lo valida")
    @PostMapping("/ingesta")
    public ApiResponse<ResultadoIngestaDto> ingesta(@Valid @RequestBody SolicitudIngestaDto solicitud) {
        ResultadoIngestaDto r = service.procesar(solicitud);
        return ApiResponse.ok("%d nuevos · %d ya existían · %d rechazados".formatted(r.accepted(), r.duplicates(), r.rejected()), r);
    }

    @GetMapping("/lotes")
    public ApiResponse<List<LoteIngestaDto>> lotes() {
        return ApiResponse.ok(service.recientes());
    }
}
