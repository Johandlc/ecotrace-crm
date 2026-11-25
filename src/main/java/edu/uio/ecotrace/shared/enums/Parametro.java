package edu.uio.ecotrace.shared.enums;

import java.util.Arrays;
import java.util.Map;
import java.util.Optional;

/**
 * Catálogo de parámetros. {@code maximo} es el límite legal de corto plazo de la Norma de Calidad del Aire
 * Ambiente del Ecuador (AM 097-A, Anexo 4, 4.1.2) para el período {@code promedioHoras}; {@code guiaOms} es la
 * guía de salud OMS 2021. Agua y ruido: valores tipo de TULSMA (demo). CO₂: umbral interno (no hay norma).
 * La bandera "excede" de cada lectura horaria es referencial; el cumplimiento formal usa el promedio del período.
 */
public enum Parametro {
    PM2_5("pm2_5", "PM2.5", "µg/m³", null, 50.0, 15.0, 24, Medio.AIRE, "NCAA 24 h · OMS 15"),
    PM10("pm10", "PM10", "µg/m³", null, 100.0, 45.0, 24, Medio.AIRE, "NCAA 24 h · OMS 45"),
    NO2("no2", "NO₂", "µg/m³", null, 200.0, 25.0, 1, Medio.AIRE, "NCAA 1 h · OMS 24 h 25"),
    O3("o3", "O₃", "µg/m³", null, 100.0, 100.0, 8, Medio.AIRE, "NCAA 8 h · OMS 100"),
    SO2("so2", "SO₂", "µg/m³", null, 125.0, 40.0, 24, Medio.AIRE, "NCAA 24 h · OMS 40"),
    CO("co", "CO", "µg/m³", null, 10000.0, 4000.0, 8, Medio.AIRE, "NCAA 8 h · OMS 24 h 4 000"),
    CO2("co2", "CO₂", "ppm", null, 500.0, null, 1, Medio.AIRE, "Umbral interno"),
    PH("ph", "pH", "", 6.5, 8.5, null, 1, Medio.AGUA, "Norma de descarga (demo)"),
    DBO("dbo", "DBO₅", "mg/L", null, 30.0, null, 1, Medio.AGUA, "Norma de descarga (demo)"),
    SST("sst", "SST", "mg/L", null, 50.0, null, 1, Medio.AGUA, "Norma de descarga (demo)"),
    DB("db", "Ruido", "dB(A)", null, 68.0, null, 1, Medio.RUIDO, "Zona mixta diurna (demo)");

    private static final Map<String, String> ALIAS = Map.of(
            "pm25", "pm2_5", "pm2.5", "pm2_5", "nitrogen_dioxide", "no2", "carbon_dioxide", "co2",
            "carbon_monoxide", "co", "ozone", "o3", "sulphur_dioxide", "so2", "ruido", "db", "dbo5", "dbo");

    private final String codigo;
    private final String etiqueta;
    private final String unidad;
    private final Double minimo;
    private final Double maximo;
    private final Double guiaOms;
    private final int promedioHoras;
    private final Medio medio;
    private final String norma;

    Parametro(String codigo, String etiqueta, String unidad, Double minimo, Double maximo, Double guiaOms, int promedioHoras, Medio medio, String norma) {
        this.codigo = codigo;
        this.etiqueta = etiqueta;
        this.unidad = unidad;
        this.minimo = minimo;
        this.maximo = maximo;
        this.guiaOms = guiaOms;
        this.promedioHoras = promedioHoras;
        this.medio = medio;
        this.norma = norma;
    }

    public boolean excede(double valor) {
        return (maximo != null && valor > maximo) || (minimo != null && valor < minimo);
    }

    public static Optional<Parametro> desdeCodigo(String raw) {
        if (raw == null) return Optional.empty();
        String c = raw.trim().toLowerCase();
        String codigo = ALIAS.getOrDefault(c, c);
        return Arrays.stream(values()).filter(p -> p.codigo.equals(codigo)).findFirst();
    }

    public String codigo() { return codigo; }
    public String etiqueta() { return etiqueta; }
    public String unidad() { return unidad; }
    public Double minimo() { return minimo; }
    public Double maximo() { return maximo; }
    public Double guiaOms() { return guiaOms; }
    public int promedioHoras() { return promedioHoras; }
    public Medio medio() { return medio; }
    public String norma() { return norma; }
}
