// Dataset base de Quito (DMQ). Fuente única para la migración Flyway V2 (scripts/generar-seed.mjs)
// y para el modo local del frontend. Ver src/main/resources/datos/fuentes-informacion.json.

// 9 administraciones zonales vigentes. lat/lon = punto de referencia en su núcleo poblado (para consultas de modelo).
export const ZONAS = [
  { id: 'Z-CHO', name: 'Chocó Andino', lat: 0.067, lon: -78.678, description: 'Parroquias rurales del noroccidente (Pacto, Gualea, Nanegal, Nanegalito, Calacalí, Nono). Reserva de biosfera; sin estaciones REMMAQ.' },
  { id: 'Z-DEL', name: 'La Delicia', lat: -0.1, lon: -78.49, description: 'Norte urbano y valle de Pomasqui–San Antonio, con terminal Carcelén y canteras de áridos.' },
  { id: 'Z-NOR', name: 'Eugenio Espejo', lat: -0.175, lon: -78.485, description: 'Centro-norte financiero y comercial, más parroquias rurales del norte (Guayllabamba, Puéllaro…).' },
  { id: 'Z-CAL', name: 'Calderón', lat: -0.098, lon: -78.423, description: 'Calderón y Llano Chico; crecimiento urbano acelerado.' },
  { id: 'Z-CEN', name: 'Manuela Sáenz', lat: -0.22, lon: -78.512, description: 'Centro Histórico y laderas orientales (Itchimbía, Puengasí).' },
  { id: 'Z-SUR', name: 'Eloy Alfaro', lat: -0.255, lon: -78.53, description: 'Sur consolidado: La Magdalena, Chimbacalle, Solanda, La Mena, Lloa.' },
  { id: 'Z-QTB', name: 'Quitumbe', lat: -0.3, lon: -78.555, description: 'Extremo sur: terminal Quitumbe, zona industrial de Turubamba y terminal de combustibles El Beaterio.' },
  { id: 'Z-TUM', name: 'Tumbaco', lat: -0.21, lon: -78.38, description: 'Valles orientales: Cumbayá, Tumbaco, Puembo, Pifo, Tababela (aeropuerto), Yaruquí, Checa, El Quinche (botadero El Inga en Pifo).' },
  { id: 'Z-CHI', name: 'Los Chillos', lat: -0.3, lon: -78.45, description: 'Valle de Los Chillos: Conocoto, Guangopolo (central térmica), Alangasí, La Merced, Píntag, Amaguaña.' },
]

export const SECTORES = {
  transporte: { label: 'Transporte terrestre', color: '#c4643f' },
  aviacion: { label: 'Aviación', color: '#2563a8' },
  energia: { label: 'Generación eléctrica', color: '#b42318' },
  residuos: { label: 'Residuos sólidos', color: '#8a6d1f' },
  aguas: { label: 'Aguas residuales', color: '#3b8ea5' },
  industria: { label: 'Industria', color: '#7c5cbf' },
  mineria: { label: 'Canteras / áridos', color: '#6b6a66' },
  combustibles: { label: 'Combustibles', color: '#0f6b4f' },
  edificios: { label: 'Combustión en edificios', color: '#d08b2c' },
  uso_suelo: { label: 'Uso del suelo e incendios', color: '#5d8a3a' },
  agro: { label: 'Agropecuario', color: '#a3a05a' },
}

const SECTOR_CT = {
  'road-transportation': 'transporte', 'international-aviation': 'aviacion', 'domestic-aviation': 'aviacion',
  'electricity-generation': 'energia', 'solid-waste-disposal': 'residuos', 'domestic-wastewater-treatment-and-discharge': 'aguas',
  'textiles-leather-apparel': 'industria', 'residential-onsite-fuel-usage': 'edificios', 'non-residential-onsite-fuel-usage': 'edificios',
}
export const sectorDeCT = (s) => SECTOR_CT[s] || (/fire|forest|shrub|soil|wetland|removals/.test(s) ? 'uso_suelo' : /cattle|manure|fertilizer|crop|rice/.test(s) ? 'agro' : 'industria')
export const SECTOR_CT_LABEL = {
  'road-transportation': 'Transporte por carretera', 'residential-onsite-fuel-usage': 'Combustión residencial (GLP)', 'non-residential-onsite-fuel-usage': 'Combustión comercial e institucional',
  'net-forest-land': 'Bosques (neto)', removals: 'Absorciones', 'shrubgrass-fires': 'Incendios de matorral', 'net-shrubgrass': 'Matorrales (neto)',
  'forest-land-degradation': 'Degradación forestal', 'enteric-fermentation-cattle-pasture': 'Ganado (fermentación entérica)', 'forest-land-fires': 'Incendios forestales',
}

const NOMBRES_CT = {
  'Mariscal Sucre International Airport': 'Aeropuerto Internacional Mariscal Sucre',
  'Santa Rosa': 'Central térmica Santa Rosa',
  'Guangopolo II power station': 'Central térmica Guangopolo II',
  'Inga Garbage Dump': 'Relleno sanitario / botadero El Inga',
  'Gualberto Hernandez': 'Central térmica Gualberto Hernández',
  'Fibran Cia. Ltda.': 'Fibran Cía. Ltda. (textil)',
}
const DESCRIPCIONES = {
  aviacion: 'Ciclos de aterrizaje y despegue y crucero asignado al aeropuerto (vuelos nacionales e internacionales).',
  energia: 'Generación termoeléctrica con derivados de petróleo.',
  residuos: 'Disposición final de residuos sólidos del DMQ; emite principalmente metano (CH₄).',
  aguas: 'Descarga de aguas residuales domésticas; metano y óxido nitroso.',
  industria: 'Instalación industrial con emisiones estimadas por Climate TRACE.',
}

// Fuentes identificadas en OpenStreetMap SIN dato público de emisiones por instalación.
export const FUENTES_OSM = [
  { id: 'O-01', name: 'Canteras de San Antonio y Pomasqui', sector: 'mineria', lat: 0.031, lon: -78.44, osm: 'way/327412534', description: 'Extracción de áridos al norte del DMQ; fuente conocida de material particulado (PM10) en el valle. Sin inventario público por cantera.' },
  { id: 'O-02', name: 'Terminal de productos limpios El Beaterio', sector: 'combustibles', lat: -0.3216, lon: -78.5409, osm: 'way/31731808', description: 'Almacenamiento y despacho de combustibles (EP Petroecuador); emisiones evaporativas de COV.' },
  { id: 'O-03', name: 'Terminal terrestre Quitumbe', sector: 'transporte', lat: -0.2957, lon: -78.5564, osm: 'way/71365138', description: 'Terminal de buses interprovinciales a diésel.' },
  { id: 'O-04', name: 'Terminal terrestre Carcelén', sector: 'transporte', lat: -0.1, lon: -78.47, osm: 'way/82583858', description: 'Terminal de buses interprovinciales a diésel.' },
  { id: 'O-05', name: 'Plantas envasadoras de GLP de Pifo', sector: 'combustibles', lat: -0.289, lon: -78.354, osm: 'way/602166686', description: 'Envasado de gas licuado (Petroecuador, Duragas, Eni).' },
  { id: 'O-06', name: 'Estación de transferencia norte (EMGIRS-EP)', sector: 'residuos', lat: -0.1522, lon: -78.4621, osm: 'way/732752972', description: 'Transferencia de residuos sólidos hacia El Inga.' },
]

// Estaciones REMMAQ (coordenadas: Maldonado 2024, EPN; San Antonio aproximada) + puntos propios de demostración.
export const PUNTOS = [
  { id: 'P-BEL', name: 'Estación Belisario', type: 'aire', site: 'REMMAQ', lat: -0.18495, lon: -78.49592 },
  { id: 'P-CAR', name: 'Estación Carapungo', type: 'aire', site: 'REMMAQ', lat: -0.09548, lon: -78.44988 },
  { id: 'P-CEN', name: 'Estación Centro', type: 'aire', site: 'REMMAQ', lat: -0.2215, lon: -78.51413 },
  { id: 'P-COT', name: 'Estación Cotocollao', type: 'aire', site: 'REMMAQ', lat: -0.11072, lon: -78.49953 },
  { id: 'P-CAM', name: 'Estación El Camal', type: 'aire', site: 'REMMAQ', lat: -0.25192, lon: -78.51713 },
  { id: 'P-GUA', name: 'Estación Guamaní', type: 'aire', site: 'REMMAQ', lat: -0.33428, lon: -78.5534 },
  { id: 'P-CHI', name: 'Estación Los Chillos', type: 'aire', site: 'REMMAQ', lat: -0.29693, lon: -78.45555 },
  { id: 'P-SAN', name: 'Estación San Antonio', type: 'aire', site: 'REMMAQ (ubicación aprox.)', lat: -0.00824, lon: -78.44513 },
  { id: 'P-TUM', name: 'Estación Tumbaco', type: 'aire', site: 'REMMAQ', lat: -0.21484, lon: -78.40326 },
  { id: 'P-MAC', name: 'Río Machángara (Guápulo) — demo', type: 'agua', site: 'Monitoreo propio (demo)', lat: -0.203, lon: -78.478 },
  { id: 'P-SPE', name: 'Río San Pedro (Conocoto) — demo', type: 'agua', site: 'Monitoreo propio (demo)', lat: -0.29, lon: -78.47 },
  { id: 'P-AER', name: 'Lindero aeropuerto (Tababela) — demo', type: 'ruido', site: 'Monitoreo propio (demo)', lat: -0.118, lon: -78.35 },
  { id: 'P-SIM', name: 'Av. Simón Bolívar (Puengasí) — demo', type: 'ruido', site: 'Monitoreo propio (demo)', lat: -0.243, lon: -78.496 },
]

export const PARTES = [
  { id: 'S-01', name: 'Secretaría de Ambiente del DMQ', type: 'autoridad', contact: 'quito.gob.ec', influence: 5, sentiment: 'neutral' },
  { id: 'S-02', name: 'Ministerio del Ambiente, Agua y Transición Ecológica', type: 'autoridad', contact: 'ambiente.gob.ec', influence: 5, sentiment: 'neutral' },
  { id: 'S-03', name: 'Laboratorio acreditado (SAE) — demo', type: 'laboratorio', contact: 'resultados@laboratorio-demo.ec', influence: 3, sentiment: 'positivo' },
  { id: 'S-04', name: 'Comité barrial Guamaní — demo', type: 'comunidad', contact: 'comite.guamani@demo.ec', influence: 4, sentiment: 'negativo' },
  { id: 'S-05', name: 'Colectivo ciudadano Aire Limpio — demo', type: 'comunidad', contact: 'contacto@airelimpio-demo.ec', influence: 3, sentiment: 'negativo' },
  { id: 'S-06', name: 'Auditor ISO 14001 — demo', type: 'auditor', contact: 'auditorias@certifica-demo.ec', influence: 4, sentiment: 'positivo' },
]

// days: días relativos a hoy (null = permanente)
export const REQUISITOS = [
  { id: 'Q-01', title: 'Norma de Calidad del Aire Ambiente (AM 097-A, Anexo 4)', kind: 'norma', authorityId: 'S-02', days: null, pointIds: ['P-BEL', 'P-CEN', 'P-CAM', 'P-GUA'], obligations: 'PM2.5 ≤ 50 µg/m³ (24 h) y ≤ 15 µg/m³ (anual); NO₂ ≤ 200 µg/m³ (1 h); O₃ ≤ 100 µg/m³ (8 h).' },
  { id: 'Q-02', title: 'Licencia ambiental de emisiones — operación norte (demo)', kind: 'permiso', authorityId: 'S-01', days: 42, pointIds: ['P-COT', 'P-SAN', 'P-CAR'], obligations: 'Monitoreo continuo de material particulado; reporte trimestral a la Secretaría.' },
  { id: 'Q-03', title: 'Norma de descargas a cuerpos de agua (TULSMA Anexo 1)', kind: 'norma', authorityId: 'S-02', days: null, pointIds: ['P-MAC', 'P-SPE'], obligations: 'Muestreo mensual de pH, DBO₅ y SST por laboratorio acreditado.' },
  { id: 'Q-04', title: 'Norma de ruido ambiente (TULSMA Anexo 5)', kind: 'norma', authorityId: 'S-01', days: null, pointIds: ['P-AER', 'P-SIM'], obligations: 'Respetar niveles máximos de ruido por uso de suelo.' },
  { id: 'Q-05', title: 'Plan de manejo ambiental — operación sur (demo)', kind: 'permiso', authorityId: 'S-01', days: -6, pointIds: ['P-GUA', 'P-CHI'], obligations: 'Actualizar PMA y presentar informe anual de cumplimiento.' },
  { id: 'Q-06', title: 'Reporte de huella de carbono (CO₂e) — demo', kind: 'norma', authorityId: 'S-01', days: 18, pointIds: ['P-BEL', 'P-TUM'], obligations: 'Inventario de emisiones alcance 1 y 2 (metodología GPC).' },
]

export const HALLAZGOS = [
  { id: 'H-01', title: 'Registro de mantenimiento de filtros incompleto (demo)', severity: 'media', status: 'en curso', origin: 'auditoría', pointId: 'P-COT', days: -2, owner: 'C. Medina' },
  { id: 'H-02', title: 'Bitácora de residuos peligrosos sin firma (demo)', severity: 'baja', status: 'cerrado', origin: 'auditoría', pointId: null, days: -20, owner: 'L. Torres' },
  { id: 'H-03', title: 'PMA operación sur vencido (demo)', severity: 'alta', status: 'abierto', origin: 'cumplimiento', pointId: 'P-GUA', days: 10, owner: 'Gerencia HSE' },
]

export const QUEJAS = [
  { id: 'C-01', stakeholderId: 'S-04', subject: 'Humo y olor a combustible cerca del terminal sur', channel: 'portal', status: 'abierta', days: -9, pointId: 'P-GUA' },
  { id: 'C-02', stakeholderId: 'S-05', subject: 'Solicitan datos públicos de PM2.5 por zona', channel: 'correo', status: 'en gestión', days: -2, pointId: 'P-CEN' },
  { id: 'C-03', stakeholderId: 'S-04', subject: 'Polvo de canteras sobre viviendas', channel: 'reunión', status: 'cerrada', days: -40, pointId: 'P-SAN' },
]

export const EVIDENCIAS = [
  { id: 'E-01', name: 'Informe_laboratorio_octubre.pdf', entity: 'requirements', entityId: 'Q-03', days: -6 },
  { id: 'E-02', name: 'Foto_filtros_caldero.jpg', entity: 'findings', entityId: 'H-01', days: -4 },
  { id: 'E-03', name: 'Acta_reunion_comite_guamani.pdf', entity: 'complaints', entityId: 'C-03', days: -39 },
]

// ---------- utilidades geográficas (sin dependencias, usadas por el seed y el frontend) ----------
const pip = (x, y, ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c } return c }
export function parroquiaDe(lon, lat, parroquias) {
  return parroquias.features.find((f) => {
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
    return polys.some((p) => pip(lon, lat, p[0]))
  })?.properties ?? null
}

/** Une instalaciones de Climate TRACE (sin los totales del DMQ) y fuentes OSM en el formato FuenteEmision. */
export function construirFuentes(ct, parroquias) {
  const out = []
  const puntuales = ct.assets.filter((a) => !a.aggregate)
  const aero = puntuales.filter((a) => a.name === 'Mariscal Sucre International Airport')
  const sum = (arr, k) => arr.reduce((s, a) => s + (a.emissions[k] ?? 0), 0)
  const resto = puntuales.filter((a) => !aero.includes(a))
  const grupos = [...(aero.length ? [aero] : []), ...resto.map((a) => [a])]
  for (const g of grupos) {
    const a = g[0]
    const sector = sectorDeCT(a.sector)
    const parr = parroquiaDe(a.lon, a.lat, parroquias)
    const nombre = a.name === 'Unknown name' ? `Aguas residuales domésticas — ${parr?.parroquia ?? 'DMQ'}` : NOMBRES_CT[a.name] || a.name
    out.push({
      id: `CT-${a.id}`, name: nombre, sector, zoneId: parr?.zonaId ?? null, parroquia: parr?.parroquia ?? 'Fuera del DMQ (límite sur)',
      lat: a.lat, lon: a.lon, year: a.year,
      co2e: Math.round(sum(g, 'co2e_100yr')), co2: Math.round(sum(g, 'co2')), ch4: +sum(g, 'ch4').toFixed(2),
      pm25: +sum(g, 'pm2_5').toFixed(2), nox: +sum(g, 'nox').toFixed(2), so2: +sum(g, 'so2').toFixed(2), co: +sum(g, 'co').toFixed(2),
      description: (g.length > 1 ? 'Suma de aviación nacional e internacional. ' : '') + (DESCRIPCIONES[sector] || ''),
      dataType: 'climate-trace', reference: g.map((x) => x.api).join(' '), coordSource: a.coordSource,
    })
  }
  for (const f of FUENTES_OSM) {
    const parr = parroquiaDe(f.lon, f.lat, parroquias)
    out.push({ ...f, zoneId: parr?.zonaId ?? null, parroquia: parr?.parroquia ?? null, year: null, co2e: null, co2: null, ch4: null, pm25: null, nox: null, so2: null, co: null,
      dataType: 'osm-sin-dato', reference: `https://www.openstreetmap.org/${f.osm}`, coordSource: `OpenStreetMap ${f.osm}` })
  }
  return out
}
