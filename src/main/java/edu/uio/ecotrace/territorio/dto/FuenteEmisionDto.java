package edu.uio.ecotrace.territorio.dto;

/** Emisiones en t/año (co2e = CO₂ equivalente a 100 años). null = sin dato público. */
public record FuenteEmisionDto(String id, String name, String sector, String zoneId, String parroquia, Double lat, Double lon, Integer year,
                               Double co2e, Double co2, Double ch4, Double pm25, Double nox, Double so2, Double co,
                               String description, String dataType, String reference, String coordSource) {
}
