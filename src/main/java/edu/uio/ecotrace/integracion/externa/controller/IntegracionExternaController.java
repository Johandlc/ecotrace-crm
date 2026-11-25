package edu.uio.ecotrace.integracion.externa.controller;

import edu.uio.ecotrace.integracion.externa.dto.BoletinDto;
import edu.uio.ecotrace.integracion.externa.openaq.dto.UbicacionOpenAqDto;
import edu.uio.ecotrace.integracion.externa.service.SincronizacionExternaService;
import edu.uio.ecotrace.integracion.ingesta.dto.ResultadoIngestaDto;
import edu.uio.ecotrace.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.*;

/**
 * Capa de presentación REST de las fuentes externas (Open-Meteo, OpenAQ, boletín) (/api/v1/integracion/externa).
 * Recibe la petición HTTP, valida el DTO con @Valid y delega en IntegracionExternaService; no contiene reglas de negocio.
 * Los permisos por rol se aplican en SeguridadConfig (lectura: cualquier usuario; escritura: ADMIN o ANALISTA).
 *
 * SOLID:
 *  - S: su única razón de cambio es el formato de la API.
 *  - D: depende de la interfaz IntegracionExternaService, que Spring inyecta por constructor.
 */
@Tag(name = "Integración — fuentes externas")
@RestController
@RequestMapping("/api/v1/integracion/externa")
public class IntegracionExternaController {

    private final SincronizacionExternaService service;

    public IntegracionExternaController(SincronizacionExternaService service) {
        this.service = service;
    }

    @Operation(summary = "Sincroniza calidad del aire real (Open-Meteo/CAMS) para los puntos de aire")
    @PostMapping("/open-meteo/sincronizar")
    public ApiResponse<ResultadoIngestaDto> openMeteo(@RequestParam(defaultValue = "12") int horas) {
        return ApiResponse.ok(service.sincronizarOpenMeteo(Math.max(1, Math.min(horas, 168))));
    }

    @Operation(summary = "Boletín de la autoridad ambiental (simulado)")
    @GetMapping("/autoridad/boletin")
    public ApiResponse<BoletinDto> boletin() {
        return ApiResponse.ok(service.boletinAutoridad());
    }

    @Operation(summary = "Estaciones oficiales cercanas a Quito vía OpenAQ v3 (requiere OPENAQ_API_KEY)")
    @GetMapping("/openaq/estaciones")
    public ApiResponse<List<UbicacionOpenAqDto>> openAq() {
        return ApiResponse.ok(service.estacionesOpenAqQuito());
    }
}
