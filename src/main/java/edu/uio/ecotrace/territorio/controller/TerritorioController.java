package edu.uio.ecotrace.territorio.controller;

import edu.uio.ecotrace.shared.response.ApiResponse;
import edu.uio.ecotrace.territorio.dto.CalidadAireZonaDto;
import edu.uio.ecotrace.territorio.dto.FuenteEmisionDto;
import edu.uio.ecotrace.territorio.dto.ZonaDto;
import edu.uio.ecotrace.territorio.service.DatosReferenciaService;
import edu.uio.ecotrace.territorio.service.TerritorioService;
import tools.jackson.databind.JsonNode;
import org.springframework.web.bind.annotation.PathVariable;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Capa de presentación REST de el territorio de Quito (zonas, fuentes de emisión y datasets reales) (/api/v1/territorio).
 * Recibe la petición HTTP, valida el DTO con @Valid y delega en TerritorioService; no contiene reglas de negocio.
 * Los permisos por rol se aplican en SeguridadConfig (lectura: cualquier usuario; escritura: ADMIN o ANALISTA).
 *
 * SOLID:
 *  - S: su única razón de cambio es el formato de la API.
 *  - D: depende de la interfaz TerritorioService, que Spring inyecta por constructor.
 */
@Tag(name = "Territorio — mapa de Quito")
@RestController
@RequestMapping("/api/v1/territorio")
public class TerritorioController {

    private final TerritorioService service;
    private final DatosReferenciaService datos;

    public TerritorioController(TerritorioService service, DatosReferenciaService datos) {
        this.service = service;
        this.datos = datos;
    }

    @Operation(summary = "Datasets reales de referencia: remmaq · climatetrace-quito · inventario-pacq-2015 · normas-calidad-aire · fuentes-informacion")
    @GetMapping("/datos/{nombre}")
    public ApiResponse<JsonNode> dataset(@PathVariable String nombre) {
        return ApiResponse.ok(datos.dataset(nombre));
    }

    @GetMapping("/zonas")
    public ApiResponse<List<ZonaDto>> zonas() {
        return ApiResponse.ok(service.zonas());
    }

    @Operation(summary = "Fuentes de emisión georreferenciadas (Climate TRACE 2024 y OpenStreetMap; ver dataType)")
    @GetMapping("/fuentes-emision")
    public ApiResponse<List<FuenteEmisionDto>> fuentes(@RequestParam(required = false) String sector,
                                                       @RequestParam(required = false) String zonaId) {
        return ApiResponse.ok(service.fuentes(sector, zonaId));
    }

    @Operation(summary = "Calidad del aire actual por zona (Open-Meteo / CAMS, caché 10 min)")
    @GetMapping("/calidad-aire")
    public ApiResponse<List<CalidadAireZonaDto>> calidadAire() {
        return ApiResponse.ok(service.calidadAire());
    }
}
