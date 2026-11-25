package edu.uio.ecotrace.reportes.controller;

import edu.uio.ecotrace.reportes.dto.InformeCumplimientoDto;
import edu.uio.ecotrace.reportes.service.ReporteService;
import edu.uio.ecotrace.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.nio.charset.StandardCharsets;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Capa de presentación REST de los informes de cumplimiento (/api/v1/reportes).
 * Recibe la petición HTTP, valida el DTO con @Valid y delega en ReporteService; no contiene reglas de negocio.
 * Los permisos por rol se aplican en SeguridadConfig (lectura: cualquier usuario; escritura: ADMIN o ANALISTA).
 *
 * SOLID:
 *  - S: su única razón de cambio es el formato de la API.
 *  - D: depende de la interfaz ReporteService, que Spring inyecta por constructor.
 */
@Tag(name = "Reportes")
@RestController
@RequestMapping("/api/v1/reportes")
public class ReporteController {

    private final ReporteService service;

    public ReporteController(ReporteService service) {
        this.service = service;
    }

    @GetMapping("/requisitos/{id}")
    public ApiResponse<InformeCumplimientoDto> informe(@PathVariable String id, @RequestParam(defaultValue = "48") int horas) {
        return ApiResponse.ok(service.informe(id, horas));
    }

    @GetMapping(value = "/requisitos/{id}/csv", produces = "text/csv")
    public ResponseEntity<byte[]> csv(@PathVariable String id, @RequestParam(defaultValue = "48") int horas) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=informe_" + id + ".csv")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(service.csv(id, horas).getBytes(StandardCharsets.UTF_8));
    }
}
