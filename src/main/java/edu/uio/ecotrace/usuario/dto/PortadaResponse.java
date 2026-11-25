package edu.uio.ecotrace.usuario.dto;

import java.util.List;

/**
 * Información pública para la pantalla de login "dinámica": dato real del aire de Quito
 * y, en desarrollo, las cuentas de demostración.
 */
public record PortadaResponse(Long ultimoDatoRemmaq, Double pm25PromedioUltimoDia, Integer estacionesActivas,
                              List<CuentaDemoDto> cuentasDemo) {
}
