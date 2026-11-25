package edu.uio.ecotrace.hallazgo.controller;

import edu.uio.ecotrace.hallazgo.dto.HallazgoDto;
import edu.uio.ecotrace.hallazgo.service.HallazgoService;
import edu.uio.ecotrace.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * Capa de presentación REST de los hallazgos (no conformidades) (/api/v1/hallazgos).
 * Recibe la petición HTTP, valida el DTO con @Valid y delega en HallazgoService; no contiene reglas de negocio.
 * Los permisos por rol se aplican en SeguridadConfig (lectura: cualquier usuario; escritura: ADMIN o ANALISTA).
 *
 * SOLID:
 *  - S: su única razón de cambio es el formato de la API.
 *  - D: depende de la interfaz HallazgoService, que Spring inyecta por constructor.
 */
@Tag(name = "Hallazgos")
@RestController
@RequestMapping("/api/v1/hallazgos")
public class HallazgoController {

    private final HallazgoService service;

    public HallazgoController(HallazgoService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<HallazgoDto>> listar() {
        return ApiResponse.ok(service.listar());
    }

    @GetMapping("/{id}")
    public ApiResponse<HallazgoDto> obtener(@PathVariable String id) {
        return ApiResponse.ok(service.obtener(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<HallazgoDto> crear(@Valid @RequestBody HallazgoDto dto) {
        return ApiResponse.ok("Hallazgo creado", service.crear(dto));
    }

    @PatchMapping("/{id}")
    public ApiResponse<HallazgoDto> actualizar(@PathVariable String id, @RequestBody HallazgoDto dto) {
        return ApiResponse.ok(service.actualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> eliminar(@PathVariable String id) {
        service.eliminar(id);
        return ApiResponse.ok("Eliminado", null);
    }
}
