package edu.uio.ecotrace.parteinteresada;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@WithMockUser(username = "admin", roles = "ADMIN")
class ParteInteresadaControllerTest {

    @Autowired
    MockMvc mvc;

    @Test
    void listaLasPartesSembradasEnLaMigracion() throws Exception {
        mvc.perform(get("/api/v1/partes-interesadas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.length()").value(6));
    }

    @Test
    void creaYRechazaDatosInvalidos() throws Exception {
        mvc.perform(post("/api/v1/partes-interesadas").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Junta parroquial Calderón\",\"type\":\"comunidad\",\"influence\":4}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").exists())
                .andExpect(jsonPath("$.data.sentiment").value("neutral"));

        mvc.perform(post("/api/v1/partes-interesadas").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\",\"type\":\"marciano\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.type").exists());
    }

    @Test
    void devuelve404ConFormatoEstandar() throws Exception {
        mvc.perform(get("/api/v1/partes-interesadas/S-NOEXISTE"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }
}
