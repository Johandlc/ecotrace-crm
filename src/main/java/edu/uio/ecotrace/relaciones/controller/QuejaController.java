package edu.uio.ecotrace.relaciones.controller;

import edu.uio.ecotrace.relaciones.dto.QuejaDto;
import edu.uio.ecotrace.relaciones.service.QuejaService;
import edu.uio.ecotrace.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * Capa de presentación REST de las quejas y solicitudes de partes interesadas (/api/v1/quejas).
 * Recibe la petición HTTP, valida el DTO con @Valid y delega en QuejaService; no contiene reglas de negocio.
 * Los permisos por rol se aplican en SeguridadConfig (lectura: cualquier usuario; escritura: ADMIN o ANALISTA).
 *
 * SOLID:
 *  - S: su única razón de cambio es el formato de la API.
 *  - D: depende de la interfaz QuejaService, que Spring inyecta por constructor.
 */
@Tag(name = "Relaciones — quejas")
@RestController
@RequestMapping("/api/v1/quejas")
public class QuejaController {

    private final QuejaService service;

    public QuejaController(QuejaService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<QuejaDto>> listar() {
        return ApiResponse.ok(service.listar());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<QuejaDto> crear(@Valid @RequestBody QuejaDto dto) {
        return ApiResponse.ok("Queja registrada", service.crear(dto));
    }

    @PatchMapping("/{id}")
    public ApiResponse<QuejaDto> actualizar(@PathVariable String id, @RequestBody QuejaDto dto) {
        return ApiResponse.ok(service.actualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> eliminar(@PathVariable String id) {
        service.eliminar(id);
        return ApiResponse.ok("Eliminado", null);
    }
}
