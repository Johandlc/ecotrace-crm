package edu.uio.ecotrace.territorio.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;
import edu.uio.ecotrace.shared.exception.ResourceNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

/**
 * Datasets de referencia versionados en src/main/resources/datos (generados por los scripts de /scripts):
 * remmaq (REMMAQ oficial), climatetrace-quito, inventario-pacq-2015, normas-calidad-aire, fuentes-informacion.
 * Se leen una vez y se sirven desde memoria.
 */
@Service
public class DatosReferenciaServiceImpl implements DatosReferenciaService {


    private final JsonMapper mapper;
    private final Map<String, JsonNode> cache = new ConcurrentHashMap<>();

    public DatosReferenciaServiceImpl(JsonMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public JsonNode dataset(String nombre) {
        if (!DATASETS.contains(nombre)) throw new ResourceNotFoundException("Dataset", nombre);
        return cache.computeIfAbsent(nombre, n -> {
            try (InputStream in = new ClassPathResource("datos/" + n + ".json").getInputStream()) {
                return mapper.readTree(in);
            } catch (IOException | JacksonException e) {
                throw new ResourceNotFoundException("Dataset", n);
            }
        });
    }
}
