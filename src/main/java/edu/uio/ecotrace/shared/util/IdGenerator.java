package edu.uio.ecotrace.shared.util;

import java.security.SecureRandom;

/** Genera identificadores legibles con prefijo de dominio, p. ej. "H-k3x9qa". */
public final class IdGenerator {

    private static final String ALFABETO = "abcdefghijklmnopqrstuvwxyz0123456789";
    private static final SecureRandom RND = new SecureRandom();

    private IdGenerator() {
    }

    public static String nuevo(String prefijo) {
        StringBuilder sb = new StringBuilder(prefijo).append('-');
        for (int i = 0; i < 6; i++) sb.append(ALFABETO.charAt(RND.nextInt(ALFABETO.length())));
        return sb.toString();
    }
}
