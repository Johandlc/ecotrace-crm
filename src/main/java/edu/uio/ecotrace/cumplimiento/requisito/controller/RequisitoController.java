package edu.uio.ecotrace.cumplimiento.requisito.controller;

import edu.uio.ecotrace.cumplimiento.requisito.dto.RequisitoDto;
import edu.uio.ecotrace.cumplimiento.requisito.service.RequisitoService;
import edu.uio.ecotrace.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * Capa de presentación REST de los requisitos de cumplimiento (permisos y normas) (/api/v1/requisitos).
 * Recibe la petición HTTP, valida el DTO con @Valid y delega en RequisitoService; no contiene reglas de negocio.
 * Los permisos por rol se aplican en SeguridadConfig (lectura: cualquier usuario; escritura: ADMIN o ANALISTA).
 *
 * SOLID:
 *  - S: su única razón de cambio es el formato de la API.
 *  - D: depende de la interfaz RequisitoService, que Spring inyecta por constructor.
 */
@Tag(name = "Cumplimiento — requisitos")
@RestController
@RequestMapping("/api/v1/requisitos")
public class RequisitoController {

    private final RequisitoService service;

    public RequisitoController(RequisitoService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<RequisitoDto>> listar() {
        return ApiResponse.ok(service.listar());
    }

    @GetMapping("/{id}")
    public ApiResponse<RequisitoDto> obtener(@PathVariable String id) {
        return ApiResponse.ok(service.obtener(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RequisitoDto> crear(@Valid @RequestBody RequisitoDto dto) {
        return ApiResponse.ok("Requisito creado", service.crear(dto));
    }

    @PatchMapping("/{id}")
    public ApiResponse<RequisitoDto> actualizar(@PathVariable String id, @RequestBody RequisitoDto dto) {
        return ApiResponse.ok(service.actualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> eliminar(@PathVariable String id) {
        service.eliminar(id);
        return ApiResponse.ok("Eliminado", null);
    }
}
