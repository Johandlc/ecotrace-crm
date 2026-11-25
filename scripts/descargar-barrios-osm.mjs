// Barrios, sectores y localidades del DMQ desde OpenStreetMap (Overpass, ODbL).
// Cada barrio queda asignado a su parroquia y administración zonal por punto-en-polígono.
// Uso: node scripts/descargar-barrios-osm.mjs  → frontend/src/data/quito-barrios.json
import { readFileSync, writeFileSync } from 'node:fs'
import { parroquiaDe } from '../frontend/src/data/quito.js'

const parroquias = JSON.parse(readFileSync(new URL('../frontend/src/data/quito-parroquias.json', import.meta.url)))
const ESPEJOS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter']
const Q = `[out:json][timeout:90];nwr["place"~"^(neighbourhood|suburb|quarter|hamlet|village|locality|isolated_dwelling)$"]["name"](-0.45,-78.95,0.36,-78.15);out center tags;`

let data = null
for (const url of ESPEJOS) {
  try {
    const r = await fetch(url, { method: 'POST', body: new URLSearchParams({ data: Q }), headers: { 'User-Agent': 'EcoTrace-CRM/0.2' }, signal: AbortSignal.timeout(60000) })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    data = await r.json()
    console.log('Overpass:', url)
    break
  } catch (e) {
    console.warn('Falló', url, e.message)
  }
}
if (!data) throw new Error('Ningún servidor Overpass respondió')

const TIPO = { neighbourhood: 'barrio', quarter: 'barrio', suburb: 'sector', hamlet: 'caserío', village: 'poblado', locality: 'localidad', isolated_dwelling: 'caserío' }
const vistos = new Set()
const barrios = []
for (const e of data.elements) {
  const lat = e.lat ?? e.center?.lat
  const lon = e.lon ?? e.center?.lon
  // NFKC + espacios colapsados: OSM a veces trae espacios no separables que duplicarían nombres.
  const nombre = e.tags.name?.normalize('NFKC').replace(/\s+/g, ' ').trim()
  if (lat == null || !nombre) continue
  const p = parroquiaDe(lon, lat, parroquias)
  if (!p) continue // fuera del DMQ
  const clave = `${nombre.toLowerCase()}|${p.parroquia}`
  if (vistos.has(clave)) continue
  vistos.add(clave)
  barrios.push({ n: nombre, t: TIPO[e.tags.place] || 'barrio', p: p.parroquia, z: p.zonaId, lat: +lat.toFixed(5), lon: +lon.toFixed(5), o: `${e.type[0]}${e.id}` })
}
barrios.sort((a, b) => a.n.localeCompare(b.n, 'es'))
writeFileSync(new URL('../frontend/src/data/quito-barrios.json', import.meta.url), JSON.stringify({
  attribution: '© OpenStreetMap contributors (ODbL 1.0) vía Overpass', descargado: new Date().toISOString(),
  campos: 'n=nombre, t=tipo, p=parroquia, z=zona, o=objeto OSM (n=node, w=way, r=relation)', barrios,
}))
const porTipo = barrios.reduce((a, b) => ((a[b.t] = (a[b.t] || 0) + 1), a), {})
console.log(barrios.length, 'lugares', porTipo)
