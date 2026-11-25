package edu.uio.ecotrace.usuario.service;

import edu.uio.ecotrace.usuario.dto.SesionResponse;
import edu.uio.ecotrace.usuario.model.UsuarioAutenticado;

/** Resultado de un login correcto: el principal para la sesión y la respuesta para el frontend. */
public record ResultadoAutenticacion(UsuarioAutenticado principal, SesionResponse sesion) {
}
