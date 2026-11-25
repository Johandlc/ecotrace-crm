package edu.uio.ecotrace.evidencia.controller;

import edu.uio.ecotrace.evidencia.dto.EvidenciaDto;
import edu.uio.ecotrace.evidencia.service.EvidenciaService;
import edu.uio.ecotrace.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * Capa de presentación REST de las evidencias documentales (/api/v1/evidencias).
 * Recibe la petición HTTP, valida el DTO con @Valid y delega en EvidenciaService; no contiene reglas de negocio.
 * Los permisos por rol se aplican en SeguridadConfig (lectura: cualquier usuario; escritura: ADMIN o ANALISTA).
 *
 * SOLID:
 *  - S: su única razón de cambio es el formato de la API.
 *  - D: depende de la interfaz EvidenciaService, que Spring inyecta por constructor.
 */
@Tag(name = "Evidencias")
@RestController
@RequestMapping("/api/v1/evidencias")
public class EvidenciaController {

    private final EvidenciaService service;

    public EvidenciaController(EvidenciaService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<EvidenciaDto>> listar() {
        return ApiResponse.ok(service.listar());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<EvidenciaDto> crear(@Valid @RequestBody EvidenciaDto dto) {
        return ApiResponse.ok("Evidencia registrada", service.crear(dto));
    }

    @PatchMapping("/{id}")
    public ApiResponse<EvidenciaDto> actualizar(@PathVariable String id, @RequestBody EvidenciaDto dto) {
        return ApiResponse.ok(service.actualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> eliminar(@PathVariable String id) {
        service.eliminar(id);
        return ApiResponse.ok("Eliminado", null);
    }
}
