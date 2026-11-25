-- Esquema del núcleo de datos único (compatible con PostgreSQL y H2 en modo PostgreSQL)

CREATE TABLE zona (
    id          VARCHAR(20) PRIMARY KEY,
    nombre      VARCHAR(120) NOT NULL,
    latitud     DOUBLE PRECISION NOT NULL,
    longitud    DOUBLE PRECISION NOT NULL,
    descripcion VARCHAR(500)
);

CREATE TABLE fuente_emision (
    id                 VARCHAR(20) PRIMARY KEY,
    nombre             VARCHAR(160) NOT NULL,
    sector             VARCHAR(40)  NOT NULL,
    zona_id            VARCHAR(20) REFERENCES zona (id),
    parroquia          VARCHAR(80),
    latitud            DOUBLE PRECISION NOT NULL,
    longitud           DOUBLE PRECISION NOT NULL,
    anio               INTEGER,
    co2e_t             DOUBLE PRECISION,
    co2_t              DOUBLE PRECISION,
    ch4_t              DOUBLE PRECISION,
    pm25_t             DOUBLE PRECISION,
    nox_t              DOUBLE PRECISION,
    so2_t              DOUBLE PRECISION,
    co_t               DOUBLE PRECISION,
    descripcion        VARCHAR(500),
    tipo_dato          VARCHAR(30) NOT NULL,
    referencia         VARCHAR(400),
    fuente_coordenadas VARCHAR(120)
);

CREATE TABLE parte_interesada (
    id             VARCHAR(20) PRIMARY KEY,
    nombre         VARCHAR(160) NOT NULL,
    tipo           VARCHAR(30)  NOT NULL,
    contacto       VARCHAR(160),
    influencia     INTEGER,
    percepcion     VARCHAR(20),
    creado_en      TIMESTAMP WITH TIME ZONE,
    actualizado_en TIMESTAMP WITH TIME ZONE
);

CREATE TABLE punto_monitoreo (
    id             VARCHAR(20) PRIMARY KEY,
    nombre         VARCHAR(160) NOT NULL,
    medio          VARCHAR(10)  NOT NULL,
    sitio          VARCHAR(120),
    zona_id        VARCHAR(20) REFERENCES zona (id),
    latitud        DOUBLE PRECISION NOT NULL,
    longitud       DOUBLE PRECISION NOT NULL,
    creado_en      TIMESTAMP WITH TIME ZONE,
    actualizado_en TIMESTAMP WITH TIME ZONE
);

CREATE TABLE lectura (
    id             VARCHAR(20) PRIMARY KEY,
    punto_id       VARCHAR(20) NOT NULL REFERENCES punto_monitoreo (id) ON DELETE CASCADE,
    parametro      VARCHAR(10) NOT NULL,
    valor          DOUBLE PRECISION NOT NULL,
    fecha_medicion TIMESTAMP WITH TIME ZONE NOT NULL,
    fuente         VARCHAR(10) NOT NULL,
    canal          VARCHAR(20) NOT NULL,
    excede         BOOLEAN NOT NULL,
    CONSTRAINT uq_lectura UNIQUE (punto_id, parametro, fecha_medicion)
);
CREATE INDEX ix_lectura_fecha ON lectura (fecha_medicion);

CREATE TABLE requisito (
    id             VARCHAR(20) PRIMARY KEY,
    titulo         VARCHAR(200) NOT NULL,
    tipo           VARCHAR(20)  NOT NULL,
    autoridad_id   VARCHAR(20) REFERENCES parte_interesada (id) ON DELETE SET NULL,
    vence          TIMESTAMP WITH TIME ZONE,
    obligaciones   VARCHAR(1000),
    creado_en      TIMESTAMP WITH TIME ZONE,
    actualizado_en TIMESTAMP WITH TIME ZONE
);

CREATE TABLE requisito_punto (
    requisito_id VARCHAR(20) NOT NULL REFERENCES requisito (id) ON DELETE CASCADE,
    punto_id     VARCHAR(20) NOT NULL,
    PRIMARY KEY (requisito_id, punto_id)
);

CREATE TABLE hallazgo (
    id             VARCHAR(20) PRIMARY KEY,
    titulo         VARCHAR(250) NOT NULL,
    severidad      VARCHAR(10)  NOT NULL,
    estado         VARCHAR(15)  NOT NULL,
    origen         VARCHAR(30)  NOT NULL,
    punto_id       VARCHAR(20),
    parametro      VARCHAR(10),
    fecha_limite   TIMESTAMP WITH TIME ZONE,
    responsable    VARCHAR(120),
    creado_en      TIMESTAMP WITH TIME ZONE,
    actualizado_en TIMESTAMP WITH TIME ZONE
);

CREATE TABLE queja (
    id             VARCHAR(20) PRIMARY KEY,
    parte_id       VARCHAR(20) REFERENCES parte_interesada (id) ON DELETE SET NULL,
    asunto         VARCHAR(300) NOT NULL,
    canal          VARCHAR(20)  NOT NULL,
    estado         VARCHAR(15)  NOT NULL,
    fecha          TIMESTAMP WITH TIME ZONE NOT NULL,
    punto_id       VARCHAR(20),
    creado_en      TIMESTAMP WITH TIME ZONE,
    actualizado_en TIMESTAMP WITH TIME ZONE
);

CREATE TABLE evidencia (
    id             VARCHAR(20) PRIMARY KEY,
    nombre         VARCHAR(200) NOT NULL,
    entidad        VARCHAR(20)  NOT NULL,
    entidad_id     VARCHAR(20)  NOT NULL,
    fecha          TIMESTAMP WITH TIME ZONE NOT NULL,
    creado_en      TIMESTAMP WITH TIME ZONE,
    actualizado_en TIMESTAMP WITH TIME ZONE
);

CREATE TABLE lote_ingesta (
    id          VARCHAR(20) PRIMARY KEY,
    fecha       TIMESTAMP WITH TIME ZONE NOT NULL,
    fuente      VARCHAR(10)  NOT NULL,
    canal       VARCHAR(20)  NOT NULL,
    etiqueta    VARCHAR(160) NOT NULL,
    recibidos   INTEGER NOT NULL,
    aceptados   INTEGER NOT NULL,
    rechazados  INTEGER NOT NULL,
    duplicados  INTEGER NOT NULL DEFAULT 0,
    excedencias INTEGER NOT NULL,
    hallazgos   INTEGER NOT NULL
);

CREATE TABLE lote_ingesta_error (
    lote_id VARCHAR(20) NOT NULL REFERENCES lote_ingesta (id) ON DELETE CASCADE,
    fila    INTEGER NOT NULL,
    motivo  VARCHAR(300) NOT NULL
);

CREATE TABLE actividad (
    id    VARCHAR(20) PRIMARY KEY,
    fecha TIMESTAMP WITH TIME ZONE NOT NULL,
    texto VARCHAR(400) NOT NULL,
    tono  VARCHAR(10)  NOT NULL
);
CREATE INDEX ix_actividad_fecha ON actividad (fecha);
