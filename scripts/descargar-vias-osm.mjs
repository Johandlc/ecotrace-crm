// Corredores viales principales del DMQ desde OpenStreetMap (Overpass, ODbL) → frontend/src/data/quito-vias.json
import { writeFileSync } from 'node:fs'
const q = `[out:json][timeout:90];way["highway"~"^(motorway|trunk)$"](-0.42,-78.62,0.02,-78.30);out tags geom;`
const r = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: new URLSearchParams({ data: q }), headers: { 'User-Agent': 'EcoTrace-CRM/0.1' } })
const d = await r.json()
// Simplificación: elimina vértices a menos de ~120 m del anterior y redondea a 4 decimales (~11 m).
const simplificar = (pts) => {
  const out = []
  for (const p of pts) { const q = [+p.lon.toFixed(4), +p.lat.toFixed(4)]; const l = out.at(-1); if (!l || Math.hypot(q[0] - l[0], q[1] - l[1]) > 0.0011) out.push(q) }
  const last = pts.at(-1); out.push([+last.lon.toFixed(4), +last.lat.toFixed(4)])
  return out
}
const features = d.elements.filter((w) => w.geometry?.length > 1).map((w) => ({
  type: 'Feature', properties: { name: w.tags.name || w.tags.ref || 'Sin nombre', highway: w.tags.highway, osmId: w.id },
  geometry: { type: 'LineString', coordinates: simplificar(w.geometry) },
}))
writeFileSync(new URL('../frontend/src/data/quito-vias.json', import.meta.url), JSON.stringify({ type: 'FeatureCollection', attribution: '© OpenStreetMap contributors (ODbL)', features }))
console.log(features.length, 'tramos', [...new Set(features.map((f) => f.properties.name))].slice(0, 30).join(' | '))
