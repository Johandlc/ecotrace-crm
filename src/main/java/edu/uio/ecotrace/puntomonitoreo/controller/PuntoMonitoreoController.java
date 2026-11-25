package edu.uio.ecotrace.puntomonitoreo.controller;

import edu.uio.ecotrace.puntomonitoreo.dto.PuntoMonitoreoDto;
import edu.uio.ecotrace.puntomonitoreo.service.PuntoMonitoreoService;
import edu.uio.ecotrace.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * Capa de presentación REST de los puntos de monitoreo (estaciones REMMAQ y puntos propios) (/api/v1/puntos).
 * Recibe la petición HTTP, valida el DTO con @Valid y delega en PuntoMonitoreoService; no contiene reglas de negocio.
 * Los permisos por rol se aplican en SeguridadConfig (lectura: cualquier usuario; escritura: ADMIN o ANALISTA).
 *
 * SOLID:
 *  - S: su única razón de cambio es el formato de la API.
 *  - D: depende de la interfaz PuntoMonitoreoService, que Spring inyecta por constructor.
 */
@Tag(name = "Puntos de monitoreo")
@RestController
@RequestMapping("/api/v1/puntos")
public class PuntoMonitoreoController {

    private final PuntoMonitoreoService service;

    public PuntoMonitoreoController(PuntoMonitoreoService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<PuntoMonitoreoDto>> listar() {
        return ApiResponse.ok(service.listar());
    }

    @GetMapping("/{id}")
    public ApiResponse<PuntoMonitoreoDto> obtener(@PathVariable String id) {
        return ApiResponse.ok(service.obtener(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<PuntoMonitoreoDto> crear(@Valid @RequestBody PuntoMonitoreoDto dto) {
        return ApiResponse.ok("Punto creado", service.crear(dto));
    }

    @PatchMapping("/{id}")
    public ApiResponse<PuntoMonitoreoDto> actualizar(@PathVariable String id, @RequestBody PuntoMonitoreoDto dto) {
        return ApiResponse.ok(service.actualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> eliminar(@PathVariable String id) {
        service.eliminar(id);
        return ApiResponse.ok("Eliminado", null);
    }
}
