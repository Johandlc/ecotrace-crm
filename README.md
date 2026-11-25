# EcoTrace CRM — gestión ambiental de emisiones (Quito)

CRM ambiental con **API interna Spring Boot 4 + PostgreSQL** (MVC por capas, SOLID) y **frontend React** (Tailwind + Motion + Leaflet + React Router), con login por sesión y roles.
Sigue el flujo: Fuentes internas/externas → Integración y validación → Núcleo de datos único →
Cumplimiento · Monitoreo · Hallazgos · Relaciones → Tableros y alertas · Reportes y portal, más un
**mapa de Quito** con zonas, fuentes de emisión animadas y calidad del aire en vivo.

## Ejecutar

Requisitos: **JDK 25 o superior**, **PostgreSQL** (probado con 18) y Node 20+ (Maven viene en el wrapper).

1. **Crear la base** (una vez, como superusuario `postgres`):
   ```bash
   psql -U postgres -f scripts/crear-base.sql
   ```
2. **Backend** (perfil `dev`: crea usuarios demo y carga datos REMMAQ/Open-Meteo):
   ```bash
   ./mvnw spring-boot:run
   ```
   Variables opcionales: `DB_URL` (por defecto `jdbc:postgresql://localhost:5432/ecotrace`), `DB_USER`, `DB_PASSWORD`, `ECOTRACE_ADMIN_PASSWORD`.
3. **Frontend en desarrollo** (proxy `/api` → 8080):
   ```bash
   cd frontend && npm install && npm run dev
   ```
4. **Pruebas** (21 casos; usan la base `ecotrace_test`, que se limpia en cada corrida):
   ```bash
   ./mvnw test
   ```

Cuentas de demostración (sólo perfil `dev`, se listan en la pantalla de login): `admin / Admin123!`, `analista / Analista123!`, `lector / Lector123!`.
En producción (`ECOTRACE_PROFILE=prod`) sólo se crea el administrador; si no defines `ECOTRACE_ADMIN_PASSWORD`, se genera una clave aleatoria y se muestra una vez en el log.

- Swagger UI: http://localhost:8080/swagger-ui.html (HTTP Basic con un usuario del CRM)
- Empaquetado único: `cd frontend && npm run build` y luego `./mvnw package` → `java -jar target/ecotrace-0.2.0.jar`

## Arquitectura MVC + SOLID

Monolito modular **package by feature**, con la misma organización que el repositorio de referencia
[crm-Artesanal](https://github.com/DiegoYanezFlores/crm-Artesanal) (paquete `edu.uio`, Spring Boot 4, Java 25, PostgreSQL):

```
src/main/java/edu/uio/ecotrace
├── EcoTraceApplication.java
├── config/        JpaConfig, OpenApiConfig, WebConfig (CORS + rutas SPA), DatosDemoSeeder
├── shared/        exception (GlobalExceptionHandler…), response (ApiResponse), enums, model, util
├── usuario/       config (SeguridadConfig, UsuariosIniciales), controller (Auth, Usuario), service,
│                  repository, model (Usuario, Rol), dto, mapper, exception
├── parteinteresada/ puntomonitoreo/ monitoreo/ hallazgo/ relaciones/ evidencia/ territorio/
├── cumplimiento/  requisito/ (+ rules/) · auditoria/
├── integracion/   ingesta/ (+ rules/) · externa/ (openmeteo, openaq)
├── nucleo/        snapshot del núcleo
└── reportes/
```

Cada módulo sigue **Controller → Service (interfaz) → ServiceImpl → Repository**:

| Capa | Responsabilidad | Principio |
|---|---|---|
| `controller` | HTTP: rutas, `@Valid`, códigos de estado | S: sólo presentación |
| `service` (interfaz) | Contrato de negocio | D/O/I: los controladores dependen de la abstracción |
| `service/*Impl` | Reglas de negocio y transacciones | S: no conoce HTTP ni JSON |
| `repository` | Spring Data JPA sobre PostgreSQL | D: interfaz, implementación generada |
| `model` / `dto` / `mapper` | Entidad, contrato JSON y conversión | S: la API no queda atada a la tabla |

Cada clase tiene un comentario con su responsabilidad, su **conexión** con otras capas y el principio **SOLID** que aplica.

El frontend (React 19 + Motion + Tailwind + Leaflet) separa **vistas** (`pages/`), **estado y acciones** (`store.jsx`) y **acceso a la API** (`api/`); usa React Router con rutas protegidas por rol.

## Seguridad y login

- Sesión HTTP con cookie `ECOTRACE_SESSION` (HttpOnly, SameSite=Lax) y cambio de id al autenticarse (evita fijación de sesión).
- CSRF para SPA: cookie `XSRF-TOKEN` → cabecera `X-XSRF-TOKEN`.
- Contraseñas BCrypt; bloqueo de 5 minutos tras 5 intentos fallidos; respuesta idéntica si el usuario no existe.
- Roles: **ADMIN** (todo + usuarios), **ANALISTA** (lee y escribe), **LECTOR** (sólo lectura).
- Auditoría: cada cambio queda en `actividad` con el usuario que lo hizo.

| Método | Ruta | |
|---|---|---|
| POST | `/api/v1/auth/login` | 200 · 400 · 401 (con intentos restantes) · 423 (bloqueada) |
| POST | `/api/v1/auth/logout` · GET `/api/v1/auth/me` · `/portada` · `/csrf` | |
| CRUD | `/api/v1/usuarios` (sólo ADMIN) | crear, cambiar rol/estado/clave, desbloquear, desactivar |

## Errores del repositorio de referencia corregidos en esta estructura

| En crm-Artesanal | En EcoTrace |
|---|---|
| Claves en texto plano y usuarios en memoria (`InMemoryUsuarioRepository`) | Tabla `usuario` en PostgreSQL con BCrypt |
| `/api/clientes` accesible sin sesión | Toda `/api/**` exige sesión; escrituras exigen rol |
| La sesión conserva el id tras el login (fijación de sesión) y guarda la entidad con la clave | `changeSessionId()` y principal sin hash |
| Sin protección CSRF | CSRF para SPA |
| `GET /api/clientes/5` devolvía todos los clientes (el Servlet ignoraba el id) | Controladores `@RestController` con `@PathVariable` y 404 real |
| `synchronized` para evitar correos duplicados (no sirve con varias instancias; la carrera terminaba en 500) | Índices únicos en BD + 409 para `DataIntegrityViolationException` |
| Usuario y clave de la BD escritos en `application.properties` | Variables de entorno |
| `schema.sql` con `spring.sql.init.mode=always` | Migraciones versionadas con Flyway |
| WebMVC + WebFlux + WebClient + RestClient a la vez y repos `spring-snapshots` | Una sola pila web; sólo Maven Central |
| Manejo de errores repetido en cada Servlet | `GlobalExceptionHandler` único (400/401/403/404/405/409/415/422/423/502/500) |
| Validaciones manuales con `if` | Bean Validation en DTOs |
| La prueba `contextLoads` dependía de una BD sin preparar | Base `ecotrace_test` limpiada y migrada por Flyway en cada corrida |
| Rutas inexistentes respondían 500 | 404 con `NoResourceFoundException` |

## Datos reales y cómo actualizarlos

| Script | Fuente | Salida |
|---|---|---|
| `node scripts/procesar-remmaq.mjs <carpeta-xlsx>` | REMMAQ oficial (descargar los `.rar` de http://datosambiente.quito.gob.ec/ y extraer los `.xlsx`) | `src/main/resources/datos/remmaq.json` |
| `node scripts/descargar-climatetrace.mjs` | Climate TRACE API v6 (sin clave) | `src/main/resources/datos/climatetrace-quito.json` |
| `node scripts/descargar-vias-osm.mjs` | OpenStreetMap / Overpass | `frontend/src/data/quito-vias.json` |
| `node scripts/descargar-barrios-osm.mjs` | OpenStreetMap / Overpass (839 barrios, sectores y poblados) | `frontend/src/data/quito-barrios.json` (buscador del mapa) |
| `node scripts/generar-seed.mjs` | `quito.js` + parroquias + Climate TRACE | `db/migration/V2__datos_base_quito.sql` |

`frontend` necesita `npm install` antes de `procesar-remmaq.mjs` (usa SheetJS). Los datasets se sirven en `GET /api/territorio/datos/{remmaq|climatetrace-quito|inventario-pacq-2015|normas-calidad-aire|fuentes-informacion}`.

## Fuentes de información

El catálogo completo (qué aporta, dónde se usa, limitaciones) está en `src/main/resources/datos/fuentes-informacion.json` y en la app (menú **Fuentes de información** o el botón «Fuente» de cada dato).

| Fuente | Tipo | Uso |
|---|---|---|
| [REMMAQ — Secretaría de Ambiente del DMQ](http://datosambiente.quito.gob.ec/) | **Oficial, medido** (2004 – 31 oct 2026) | Capa Aire del mapa, time-lapse de octubre 2026 (31 días, hora a hora), tendencias, días sobre norma, lecturas de Monitoreo y alertas |
| [Maldonado (2024), EPN — Tabla 2.1.1](https://bibdigital.epn.edu.ec/bitstream/15000/25693/1/CD%2014247.pdf) | Referencia | Coordenadas de 8 estaciones (San Antonio aproximada) |
| [Climate TRACE](https://climatetrace.org/) (CC BY 4.0) | Estimación 2024 | Emisiones por instalación (aeropuerto, centrales térmicas, El Inga, aguas residuales, industria) y totales del DMQ |
| [PACQ 2020 — Inventario GEI 2015](https://www.fondoambientalquito.gob.ec/wp-content/uploads/2022/10/Quito_CAP_2020.pdf) | Oficial | 7 611 216 t CO₂e: transporte 40 %, energía 26 %, AFOLU 24 %, residuos 10 % |
| [NCAA — AM 097-A, Anexo 4](https://faolex.fao.org/docs/pdf/ecu155133.pdf) | Norma | Límites legales y umbrales de alerta/alarma/emergencia |
| [OMS 2021](https://www.who.int/publications/i/item/9789240034228) | Guía de salud | Comparación de salud |
| [OpenStreetMap](https://www.openstreetmap.org/copyright) (ODbL) | Real | Parroquias, barrios del buscador, ubicaciones de fuentes, corredores viales, mapa base |
| [Administraciones zonales (Wikipedia)](https://es.wikipedia.org/wiki/Distrito_Metropolitano_de_Quito) | Referencia secundaria | 9 zonas vigentes; verificar con ordenanza |
| [Open-Meteo / CAMS](https://open-meteo.com/en/docs/air-quality-api) | Modelo | Valores "ahora" (resolución ~40 km) |
| [USFQ — inventario de tráfico 2012](https://repositorio.usfq.edu.ec/handle/23000/4178) | Referencia | Contexto de emisiones del tráfico |
| Demo | **Simulado** | Agua, ruido, sensores en vivo, boletín, partes/quejas/hallazgos marcados "demo" |
