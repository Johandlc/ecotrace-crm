// Procesa los datos históricos OFICIALES de la REMMAQ (Secretaría de Ambiente del DMQ).
// 1) Descargar de http://datosambiente.quito.gob.ec/ los .rar de PM2.5, PM10, NO2, O3, CO, SO2
// 2) Extraer cada uno (p. ej. `bsdtar -xf PM2.5.rar`) y dejar los .xlsx en una carpeta
// 3) node scripts/procesar-remmaq.mjs <carpeta-con-xlsx>
// Salida: src/main/resources/datos/remmaq.json (resúmenes anuales, mensuales, diarios y 14 días horarios)
import { createRequire } from 'node:module'
import { readdirSync, writeFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const require = createRequire(new URL('../frontend/package.json', import.meta.url))
const XLSX = require('xlsx')
const dir = process.argv[2]
if (!dir) throw new Error('Uso: node scripts/procesar-remmaq.mjs <carpeta-con-xlsx>')

const H = 3600000, D = 86400000, TZ = 5 * H // Quito = UTC-5, sin horario de verano
const ESTACIONES = [
  { id: 'P-BEL', code: 'BEL', col: 'BELISARIO', name: 'Belisario', lat: -0.18495, lon: -78.49592 },
  { id: 'P-CAR', code: 'CAR', col: 'CARAPUNGO', name: 'Carapungo', lat: -0.09548, lon: -78.44988 },
  { id: 'P-CEN', code: 'CEN', col: 'CENTRO', name: 'Centro', lat: -0.2215, lon: -78.51413 },
  { id: 'P-COT', code: 'COT', col: 'COTOCOLLAO', name: 'Cotocollao', lat: -0.11072, lon: -78.49953 },
  { id: 'P-CAM', code: 'CAM', col: 'EL CAMAL', name: 'El Camal', lat: -0.25192, lon: -78.51713 },
  { id: 'P-GUA', code: 'GUA', col: 'GUAMANI', name: 'Guamaní', lat: -0.33428, lon: -78.5534 },
  { id: 'P-CHI', code: 'LCH', col: 'LOS CHILLOS', name: 'Los Chillos', lat: -0.29693, lon: -78.45555 },
  { id: 'P-SAN', code: 'SAP', col: 'SAN ANTONIO', name: 'San Antonio', lat: -0.00824, lon: -78.44513, approx: true },
  { id: 'P-TUM', code: 'TUM', col: 'TUMBACO', name: 'Tumbaco', lat: -0.21484, lon: -78.40326 },
]
const CONTAMINANTES = {
  pm2_5: { file: /^PM2\.?5/i, label: 'PM2.5', unit: 'µg/m³', max: 500 },
  pm10: { file: /^PM10/i, label: 'PM10', unit: 'µg/m³', max: 1000 },
  no2: { file: /^NO2/i, label: 'NO₂', unit: 'µg/m³', max: 1000 },
  o3: { file: /^O3/i, label: 'O₃', unit: 'µg/m³', max: 600 },
  co: { file: /^CO\./i, label: 'CO', unit: 'mg/m³', max: 50 },
  so2: { file: /^SO2/i, label: 'SO₂', unit: 'µg/m³', max: 1000 },
}
// La columna FECHA viene como número de serie de Excel o como texto 'AAAA-MM-DD hh:mm:ss' (hora local).
function tsDe(x) {
  if (typeof x === 'number') return Math.round((x - 25569) * 24) * H + TZ
  if (typeof x === 'string') {
    const m = x.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/)
    if (m) return Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) + TZ) / H) * H
  }
  return null
}
// Límite de plausibilidad física: descarta códigos de error o valores imposibles que queden en la serie.
const valido = (v, max) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max
const r2 = (v) => (v == null ? null : Math.round(v * 100) / 100)
const maxOf = (it) => { let m = -Infinity; for (const x of it) if (x > m) m = x; return m }
const minOf = (it) => { let m = Infinity; for (const x of it) if (x < m) m = x; return m }
const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : null)

const files = readdirSync(dir).filter((f) => f.endsWith('.xlsx'))
const out = {
  meta: {
    source: 'REMMAQ — Red Metropolitana de Monitoreo Atmosférico de Quito, Secretaría de Ambiente del DMQ',
    url: 'http://datosambiente.quito.gob.ec/',
    qaqc: 'http://datosambiente.quito.gob.ec/datos/Marco_QAQC_REMMAQ.pdf',
    coordinates: 'Tabla 2.1.1, Maldonado (2024), EPN — https://bibdigital.epn.edu.ec/bitstream/15000/25693/1/CD%2014247.pdf. San Antonio: centro parroquial (aprox.).',
    processedAt: new Date().toISOString(),
    timezone: 'America/Guayaquil (UTC-5); los ts están en epoch ms UTC',
  },
  stations: ESTACIONES,
  pollutants: {},
  annual: {}, monthly: {}, daily: {}, hourly: { step: H, series: {} },
}
let globalLast = 0

for (const [key, cfg] of Object.entries(CONTAMINANTES)) {
  const f = files.find((x) => cfg.file.test(x))
  if (!f) { console.warn('Falta archivo para', key); continue }
  const wb = XLSX.readFile(join(dir, f), { dense: true })
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true })
  const head = rows[0].map((h) => String(h).trim().toUpperCase())
  const series = {} // id -> Map(ts -> value)
  for (const st of ESTACIONES) {
    const c = head.indexOf(st.col)
    if (c < 0) continue
    const m = new Map()
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i]
      const ts = r && tsDe(r[0])
      if (ts == null || !valido(r[c], cfg.max)) continue
      m.set(ts, r[c])
    }
    if (m.size) series[st.id] = m
  }
  const last = maxOf(Object.values(series).map((m) => maxOf(m.keys())))
  const first = minOf(Object.values(series).map((m) => minOf(m.keys())))
  globalLast = Math.max(globalLast, last)
  out.pollutants[key] = { label: cfg.label, unit: cfg.unit, file: f, first, last, stations: Object.keys(series) }
  out.annual[key] = {}; out.monthly[key] = {}; out.daily[key] = {}; out.hourly.series[key] = {}

  for (const [id, m] of Object.entries(series)) {
    // diarios (día local) con ≥ 18 h válidas; máximo horario y máximo móvil 8 h
    const byDay = new Map()
    for (const [ts, v] of m) {
      const day = Math.floor((ts - TZ) / D) * D + TZ
      if (!byDay.has(day)) byDay.set(day, [])
      byDay.get(day).push([ts, v])
    }
    const daily = []
    for (const [day, arr] of [...byDay].sort((a, b) => a[0] - b[0])) {
      if (arr.length < 18) continue
      const vals = arr.map((x) => x[1])
      let max8 = null
      for (let h = 0; h < 24; h++) {
        const w = []
        for (let k = 0; k < 8; k++) { const v = m.get(day + (h - k) * H); if (v != null) w.push(v) }
        if (w.length >= 6) max8 = Math.max(max8 ?? -Infinity, mean(w))
      }
      daily.push([day, r2(mean(vals)), r2(maxOf(vals)), r2(max8)])
    }
    // anuales (≥ 75 % de días válidos para considerarse representativo)
    const byYear = {}
    for (const [day, avg] of daily) { const y = new Date(day - TZ).getUTCFullYear(); (byYear[y] ||= []).push(avg) }
    out.annual[key][id] = Object.fromEntries(Object.entries(byYear).filter(([y]) => +y >= 2010)
      .map(([y, a]) => [y, { mean: r2(mean(a)), days: a.length }]))
    // mensuales: últimos 36 meses
    const byMonth = {}
    for (const [day, avg] of daily) { const d = new Date(day - TZ); const k = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`; (byMonth[k] ||= []).push(avg) }
    out.monthly[key][id] = Object.entries(byMonth).sort().slice(-36).filter(([, a]) => a.length >= 15).map(([k, a]) => [k, r2(mean(a))])
    // diarios: últimos 365 días
    out.daily[key][id] = daily.filter(([day]) => day > last - 365 * D)
  }
  console.log(`${key}: ${Object.keys(series).length} estaciones, último dato ${new Date(last).toISOString()}`)
}

// horarios: últimos 14 días comunes a todos los contaminantes
const start = globalLast - 14 * 24 * H + H
out.hourly.start = start
out.hourly.n = 14 * 24
for (const key of Object.keys(out.pollutants)) {
  const f = files.find((x) => CONTAMINANTES[key].file.test(x))
  const wb = XLSX.readFile(join(dir, f), { dense: true })
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: true })
  const head = rows[0].map((h) => String(h).trim().toUpperCase())
  for (const st of ESTACIONES) {
    const c = head.indexOf(st.col)
    if (c < 0) continue
    const arr = new Array(out.hourly.n).fill(null)
    for (let i = rows.length - 1; i > 0; i--) {
      const r = rows[i]
      const ts = r && tsDe(r[0])
      if (ts == null) continue
      if (ts < start) break
      const idx = (ts - start) / H
      if (idx >= 0 && idx < arr.length && valido(r[c], CONTAMINANTES[key].max)) arr[idx] = r2(r[c])
    }
    if (arr.some((v) => v != null)) out.hourly.series[key][st.id] = arr
  }
}
out.meta.lastTs = globalLast
const target = new URL('../src/main/resources/datos/remmaq.json', import.meta.url)
writeFileSync(target, JSON.stringify(out))
console.log('remmaq.json', Math.round(statSync(target).size / 1024), 'KB')
