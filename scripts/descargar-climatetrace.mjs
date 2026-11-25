// Descarga emisiones por instalación de Climate TRACE (API v6, CC BY 4.0) dentro del DMQ.
// Uso: node scripts/descargar-climatetrace.mjs  → src/main/resources/datos/climatetrace-quito.json
import { readFileSync, writeFileSync } from 'node:fs'

const API = 'https://api.climatetrace.org/v6'
const parroquias = JSON.parse(readFileSync(new URL('../frontend/src/data/quito-parroquias.json', import.meta.url)))
// Instalaciones fuera del límite del DMQ pero dentro de su cuenca atmosférica (se marcan como "fuera del DMQ").
const VECINAS = new Set([25451105]) // Central térmica Santa Rosa (límite sur)
// Coordenadas más precisas desde OpenStreetMap cuando existen (way id).
const OSM = {
  25451105: { lat: -0.3634, lon: -78.5404, osm: 'way/831336203' },
  448303: { lat: -0.2713, lon: -78.4512, osm: 'way/207309465' },
  46010957: { lat: -0.2945, lon: -78.3576, osm: 'way/376023649' },
  3169634: { lat: -0.1274, lon: -78.3554, osm: 'way/214256485' },
  3174540: { lat: -0.1274, lon: -78.3554, osm: 'way/214256485' },
}

const pip = (x, y, ring) => { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c } return c }
const parroquiaDe = (lon, lat) => parroquias.features.find((f) => {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
  return polys.some((p) => pip(lon, lat, p[0]))
})?.properties

async function json(url) {
  const r = await fetch(url, { headers: { 'User-Agent': 'EcoTrace-CRM/0.1' } })
  if (!r.ok) throw new Error(`${url} → ${r.status}`)
  return r.json()
}

const todos = []
for (let offset = 0; ; offset += 1000) {
  const page = await json(`${API}/assets?countries=ECU&limit=1000&offset=${offset}`)
  if (!page.assets?.length) break
  todos.push(...page.assets)
}
const candidatos = todos.filter((a) => {
  const [lon, lat] = a.Centroid?.Geometry || []
  return lat != null && (VECINAS.has(a.Id) || parroquiaDe(lon, lat))
})

const GASES = ['co2e_100yr', 'co2', 'ch4', 'n2o', 'pm2_5', 'nox', 'so2', 'co', 'voc', 'bc']
const assets = []
for (const a of candidatos) {
  const d = await json(`${API}/assets/${a.Id}`)
  const years = [...new Set((d.EmissionsDetails || []).map((e) => e.Year))].sort()
  const year = years.at(-1)
  const g = Object.fromEntries(GASES.map((k) => [k, (d.EmissionsDetails || []).find((e) => e.Gas === k && e.Year === year)?.EmissionsQuantity ?? null]))
  const det = (d.EmissionsDetails || []).find((e) => e.Gas === 'co2e_100yr' && e.Year === year) || {}
  const [lon, lat] = a.Centroid.Geometry
  const pos = OSM[a.Id] || { lat, lon }
  const agregado = a.Name.includes('Distrito Metropolitano') || a.Name.includes('Canton')
  const parr = agregado ? null : parroquiaDe(pos.lon, pos.lat)
  assets.push({
    id: a.Id, name: a.Name, sector: a.Sector, assetType: a.AssetType || null, year,
    aggregate: agregado,
    lat: pos.lat, lon: pos.lon, coordSource: pos.osm ? `OpenStreetMap ${pos.osm}` : 'Climate TRACE (centroide)',
    parroquia: parr?.parroquia ?? null, zona: parr?.zona ?? (VECINAS.has(a.Id) ? 'Fuera del DMQ (límite sur)' : null), zonaId: parr?.zonaId ?? null,
    emissions: g, activity: det.Activity ?? null, activityUnits: det.ActivityUnits ?? null, capacity: det.Capacity ?? null, capacityUnits: det.CapacityUnits ?? null,
    api: `${API}/assets/${a.Id}`,
  })
}
assets.sort((p, q) => (q.emissions.co2e_100yr ?? 0) - (p.emissions.co2e_100yr ?? 0))
writeFileSync(new URL('../src/main/resources/datos/climatetrace-quito.json', import.meta.url), JSON.stringify({
  meta: { source: 'Climate TRACE — API v6', url: 'https://climatetrace.org/', api: API, license: 'CC BY 4.0', downloadedAt: new Date().toISOString(),
    note: 'Estimaciones independientes basadas en satélites, modelos y datos públicos; no son mediciones en chimenea. Unidades: toneladas/año.' },
  assets,
}, null, 1))
console.log(assets.length, 'activos'); assets.forEach((a) => console.log(a.year, a.aggregate ? '[DMQ]' : '     ', a.name, '|', a.sector, '|', a.zona, '|', Math.round(a.emissions.co2e_100yr ?? 0), 't CO2e', '| PM2.5', a.emissions.pm2_5, '| NOx', a.emissions.nox))
