package edu.uio.ecotrace.territorio;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TerritorioControllerTest {

    @Autowired
    MockMvc mvc;

    @Test
    void exponeZonasYFuentesDeQuito() throws Exception {
        mvc.perform(get("/api/v1/territorio/zonas")).andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(9));
        mvc.perform(get("/api/v1/territorio/fuentes-emision").param("sector", "energia"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(3))
                .andExpect(jsonPath("$.data[0].dataType").value("climate-trace"))
                .andExpect(jsonPath("$.data[0].year").value(2024));
    }

    @Test
    void sirveDatasetsRealesDeReferencia() throws Exception {
        mvc.perform(get("/api/v1/territorio/datos/remmaq"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stations.length()").value(9))
                .andExpect(jsonPath("$.data.hourly.n").value(336));
        mvc.perform(get("/api/v1/territorio/datos/inventario-pacq-2015")).andExpect(jsonPath("$.data.total").value(7611216));
        mvc.perform(get("/api/v1/territorio/datos/normas-calidad-aire")).andExpect(jsonPath("$.data.contaminantes.pm2_5.ncaa['24h']").value(50));
        mvc.perform(get("/api/v1/territorio/datos/no-existe")).andExpect(status().isNotFound());
    }
}
