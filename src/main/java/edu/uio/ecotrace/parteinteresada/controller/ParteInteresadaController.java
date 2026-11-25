package edu.uio.ecotrace.parteinteresada.controller;

import edu.uio.ecotrace.parteinteresada.dto.ParteInteresadaDto;
import edu.uio.ecotrace.parteinteresada.service.ParteInteresadaService;
import edu.uio.ecotrace.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

/**
 * Capa de presentación REST de las partes interesadas (autoridades, comunidad, laboratorios, auditores) (/api/v1/partes-interesadas).
 * Recibe la petición HTTP, valida el DTO con @Valid y delega en ParteInteresadaService; no contiene reglas de negocio.
 * Los permisos por rol se aplican en SeguridadConfig (lectura: cualquier usuario; escritura: ADMIN o ANALISTA).
 *
 * SOLID:
 *  - S: su única razón de cambio es el formato de la API.
 *  - D: depende de la interfaz ParteInteresadaService, que Spring inyecta por constructor.
 */
@Tag(name = "Partes interesadas")
@RestController
@RequestMapping("/api/v1/partes-interesadas")
public class ParteInteresadaController {

    private final ParteInteresadaService service;

    public ParteInteresadaController(ParteInteresadaService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<List<ParteInteresadaDto>> listar() {
        return ApiResponse.ok(service.listar());
    }

    @GetMapping("/{id}")
    public ApiResponse<ParteInteresadaDto> obtener(@PathVariable String id) {
        return ApiResponse.ok(service.obtener(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ParteInteresadaDto> crear(@Valid @RequestBody ParteInteresadaDto dto) {
        return ApiResponse.ok("Parte interesada creada", service.crear(dto));
    }

    @PatchMapping("/{id}")
    public ApiResponse<ParteInteresadaDto> actualizar(@PathVariable String id, @RequestBody ParteInteresadaDto dto) {
        return ApiResponse.ok(service.actualizar(id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> eliminar(@PathVariable String id) {
        service.eliminar(id);
        return ApiResponse.ok("Eliminado", null);
    }
}
