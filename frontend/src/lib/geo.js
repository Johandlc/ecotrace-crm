// Utilidades de interpolación espacial para el mapa.
import parroquias from '../data/quito-parroquias.json'

const centroide = (geom) => {
  const ring = geom.type === 'Polygon' ? geom.coordinates[0] : geom.coordinates.reduce((a, p) => (p[0].length > a.length ? p[0] : a), [])
  let x = 0, y = 0
  for (const [lon, lat] of ring) { x += lon; y += lat }
  return [y / ring.length, x / ring.length]
}
export const CENTROIDES = Object.fromEntries(parroquias.features.map((f) => [f.properties.parroquia, centroide(f.geometry)]))

/**
 * Interpolación IDW (potencia 2) desde estaciones con dato. Devuelve null si la estación más cercana
 * está a más de ~13 km (0.12°): fuera de cobertura de la red no se inventa un valor.
 */
export function idw([lat, lon], estaciones, valores, maxDist = 0.12) {
  let num = 0, den = 0, dmin = Infinity
  for (const s of estaciones) {
    const v = valores[s.id]
    if (v == null) continue
    const d = Math.hypot(s.lat - lat, (s.lon - lon) * Math.cos((lat * Math.PI) / 180))
    if (d < 1e-4) return v
    dmin = Math.min(dmin, d)
    const w = 1 / (d * d)
    num += w * v
    den += w
  }
  return dmin > maxDist || !den ? null : num / den
}

/** Distancia en km entre dos puntos (fórmula de haversine). */
export function distanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371, rad = Math.PI / 180
  const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/** Normaliza texto para buscar sin tildes ni mayúsculas ("Guápulo" ≈ "guapulo"). */
export const normalizar = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
