-- Usuarios del CRM (reemplaza al repositorio en memoria con claves en texto plano del proyecto de referencia).
-- password_hash guarda BCrypt ({bcrypt}$2a$...), nunca la clave.
CREATE TABLE usuario (
    id                BIGSERIAL PRIMARY KEY,
    username          VARCHAR(40)  NOT NULL,
    password_hash     VARCHAR(100) NOT NULL,
    nombre_completo   VARCHAR(120) NOT NULL,
    correo            VARCHAR(120),
    rol               VARCHAR(20)  NOT NULL CHECK (rol IN ('ADMIN', 'ANALISTA', 'LECTOR')),
    activo            BOOLEAN      NOT NULL DEFAULT TRUE,
    intentos_fallidos INTEGER      NOT NULL DEFAULT 0,
    bloqueado_hasta   TIMESTAMP WITH TIME ZONE,
    ultimo_acceso     TIMESTAMP WITH TIME ZONE,
    creado_en         TIMESTAMP WITH TIME ZONE,
    actualizado_en    TIMESTAMP WITH TIME ZONE
);
-- Username único sin distinguir mayúsculas (admin = ADMIN)
CREATE UNIQUE INDEX uq_usuario_username ON usuario (LOWER(username));
CREATE UNIQUE INDEX uq_usuario_correo ON usuario (LOWER(correo)) WHERE correo IS NOT NULL;

-- Índices para las consultas más frecuentes (lectura ya tiene uq_lectura sobre punto+parámetro+fecha)
CREATE INDEX IF NOT EXISTS ix_hallazgo_punto_estado ON hallazgo (punto_id, parametro, estado);
CREATE INDEX IF NOT EXISTS ix_lote_ingesta_fecha ON lote_ingesta (fecha DESC);

-- Auditoría: quién hizo cada cambio
ALTER TABLE actividad ADD COLUMN usuario VARCHAR(40);
