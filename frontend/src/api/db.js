// Almacén del modo local (sin backend). Se siembra con el mismo dataset de Quito que la migración Flyway V2.
import { MEDIA, isExceed } from '../lib/params'
import { PUNTOS, PARTES, REQUISITOS, HALLAZGOS, QUEJAS, EVIDENCIAS, parroquiaDe } from '../data/quito'
import parroquias from '../data/quito-parroquias.json'
import { cargarDataset } from './referencia'

const KEY = 'ecotrace-db-v3'
const H = 3600000
const D = 86400000
const rel = (days) => (days == null ? null : Date.now() + days * D)

export const uid = (p) => `${p}-${Math.random().toString(36).slice(2, 8)}`

function seed() {
  const now = Math.floor(Date.now() / H) * H
  const points = PUNTOS.map((p) => ({ ...p, zoneId: parroquiaDe(p.lon, p.lat, parroquias)?.zonaId ?? null }))
  const base = { pm2_5: 16, pm10: 32, no2: 60, co2: 440, ph: 7.4, dbo: 22, sst: 30, db: 62 }
  const amp = { pm2_5: 8, pm10: 14, no2: 40, co2: 45, ph: 0.6, dbo: 12, sst: 14, db: 8 }
  const readings = []
  // Aire: se completa con datos oficiales REMMAQ en prepararDb(); aquí sólo series demo de agua y ruido.
  points.filter((pt) => pt.type !== 'aire').forEach((pt, i) => {
    MEDIA[pt.type].params.forEach((param) => {
      for (let h = 47; h >= 0; h -= 1) {
        const wave = Math.sin((h + i * 3) / 4) * 0.6 + Math.sin(h / 1.7) * 0.25
        const value = Math.max(0, +(base[param] + amp[param] * wave + (Math.random() - 0.5) * amp[param] * 0.5).toFixed(param === 'ph' ? 2 : 1))
        readings.push({ id: uid('R'), pointId: pt.id, param, value, ts: now - h * H, source: pt.type === 'agua' ? 'externa' : 'interna', channel: 'demo', exceed: isExceed(param, value) })
      }
    })
  })
  return {
    points,
    readings,
    stakeholders: PARTES.map((s) => ({ ...s })),
    requirements: REQUISITOS.map(({ days, ...q }) => ({ ...q, expires: rel(days), status: days != null && days < 0 ? 'vencido' : 'vigente' })),
    findings: HALLAZGOS.map(({ days, ...f }) => ({ ...f, due: rel(days), createdAt: Date.now() - 3 * D })),
    complaints: QUEJAS.map(({ days, ...c }) => ({ ...c, ts: rel(days) })),
    evidence: EVIDENCIAS.map(({ days, ...e }) => ({ ...e, ts: rel(days) })),
    ingestLog: [{ id: uid('I'), ts: Date.now(), source: 'interna', channel: 'demo', label: 'Demo · agua y ruido (modo local)', received: readings.length, accepted: readings.length, rejected: 0, exceedances: readings.filter((r) => r.exceed).length, errors: [] }],
    remmaqCargado: false,
    activity: [{ id: uid('A'), ts: Date.now(), text: 'Modo local: datos de demostración cargados (sin backend)', tone: 'neutral' }],
  }
}

/** Completa el almacén local con los últimos 7 días oficiales de la REMMAQ (mismo dataset que usa el backend). */
export async function prepararDb() {
  const d = db()
  if (d.remmaqCargado) return d
  try {
    const r = await cargarDataset('remmaq', false)
    const { start, step, n, series } = r.hourly
    const desde = Math.max(0, n - 7 * 24)
    let count = 0
    for (const [param, est] of Object.entries(series)) {
      for (const [pointId, arr] of Object.entries(est)) {
        for (let i = desde; i < n; i++) {
          if (arr[i] == null) continue
          const value = param === 'co' ? arr[i] * 1000 : arr[i] // CO: mg/m³ → µg/m³
          d.readings.push({ id: uid('R'), pointId, param, value, ts: start + i * step, source: 'externa', channel: 'remmaq', exceed: isExceed(param, value) })
          count++
        }
      }
    }
    d.ingestLog.unshift({ id: uid('I'), ts: Date.now(), source: 'externa', channel: 'remmaq', label: 'REMMAQ · datos oficiales validados', received: count, accepted: count, rejected: 0, exceedances: 0, errors: [] })
    d.activity.unshift({ id: uid('A'), ts: Date.now(), text: `REMMAQ: ${count} lecturas oficiales integradas`, tone: 'ext' })
    d.remmaqCargado = true
    persist()
  } catch { /* sin dataset: se continúa con lo disponible */ }
  return d
}

let cache = null
export function db() {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    cache = raw ? JSON.parse(raw) : seed()
  } catch {
    cache = seed()
  }
  return cache
}
export function persist() {
  try {
    const d = db()
    d.readings = d.readings.slice(-12000)
    d.activity = d.activity.slice(0, 200)
    localStorage.setItem(KEY, JSON.stringify(d))
  } catch { /* almacenamiento no disponible */ }
}
export function resetDb() {
  cache = seed()
  persist()
}
