package edu.uio.ecotrace.usuario;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Login por sesión de extremo a extremo contra PostgreSQL: credenciales, sesión, roles, CSRF y bloqueo.
 * Corresponde a los casos 200/400/401 del AuthController de referencia, más 403 y 423.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    MockMvc mvc;

    private MvcResult login(String user, String pass) throws Exception {
        return mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"" + user + "\",\"password\":\"" + pass + "\"}")).andReturn();
    }

    @Test
    void apiProtegidaSinSesionDevuelve401EnJson() throws Exception {
        mvc.perform(get("/api/v1/nucleo/snapshot"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void loginCorrectoCreaSesionYMeLaDevuelve() throws Exception {
        MvcResult r = login("admin", "Admin123!");
        org.assertj.core.api.Assertions.assertThat(r.getResponse().getStatus()).isEqualTo(200);
        MockHttpSession sesion = (MockHttpSession) r.getRequest().getSession(false);

        mvc.perform(get("/api/v1/auth/me").session(sesion))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.rol").value("ADMIN"))
                .andExpect(jsonPath("$.data.permisos[2]").value("administrar"));
        mvc.perform(get("/api/v1/partes-interesadas").session(sesion)).andExpect(status().isOk());
    }

    @Test
    void datosVaciosDan400YClaveIncorrectaIndicaIntentosRestantes() throws Exception {
        mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"username\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.data.username").exists());
        mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"analista\",\"password\":\"mala-clave\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.data.intentosRestantes").value(4));
    }

    @Test
    void usuarioInexistenteNoRevelaSiExiste() throws Exception {
        mvc.perform(post("/api/v1/auth/login").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"nadie\",\"password\":\"x\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Usuario o contraseña incorrectos"));
    }

    @Test
    void lectorNoPuedeEscribirNiAdministrarUsuarios() throws Exception {
        MockHttpSession sesion = (MockHttpSession) login("lector", "Lector123!").getRequest().getSession(false);
        mvc.perform(post("/api/v1/hallazgos").session(sesion).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"x\"}"))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/usuarios").session(sesion)).andExpect(status().isForbidden());
        mvc.perform(get("/api/v1/hallazgos").session(sesion)).andExpect(status().isOk());
    }

    @Test
    void escrituraSinTokenCsrfSeRechaza() throws Exception {
        MockHttpSession sesion = (MockHttpSession) login("admin", "Admin123!").getRequest().getSession(false);
        mvc.perform(post("/api/v1/hallazgos").session(sesion).contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"x\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void cincoIntentosFallidosBloqueanLaCuenta() throws Exception {
        mvc.perform(post("/api/v1/usuarios").with(csrf()).with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"temporal\",\"nombre\":\"Cuenta temporal\",\"rol\":\"LECTOR\",\"password\":\"Temporal123\"}"))
                .andExpect(status().isCreated());
        for (int i = 0; i < 4; i++) login("temporal", "incorrecta");
        org.assertj.core.api.Assertions.assertThat(login("temporal", "incorrecta").getResponse().getStatus()).isEqualTo(423);
        // Bloqueada: ni siquiera la clave correcta entra.
        org.assertj.core.api.Assertions.assertThat(login("temporal", "Temporal123").getResponse().getStatus()).isEqualTo(423);
    }

    @Test
    void portadaPublicaIncluyeDatoRealDeLaRemmaq() throws Exception {
        mvc.perform(get("/api/v1/auth/portada"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.pm25PromedioUltimoDia").isNumber())
                .andExpect(jsonPath("$.data.cuentasDemo.length()").value(3));
    }
}
