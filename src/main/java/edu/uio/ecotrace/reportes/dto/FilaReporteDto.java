package edu.uio.ecotrace.reportes.dto;

/**
 * Fila del informe: estadística de un parámetro en un punto (n, promedio, máximo, límite y excedencias).
 */
public record FilaReporteDto(String punto, String nombre, String parametro, String unidad, int n, double promedio,
                             double maximo, Double limite, int excedencias) {
}
