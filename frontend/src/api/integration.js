// Capa de integración y validación: normaliza, valida y deduplica antes de escribir en el núcleo.
import { db, uid, persist } from './db'
import { PARAMS, isExceed } from '../lib/params'

const ALIAS = { pm25: 'pm2_5', 'pm2.5': 'pm2_5', nitrogen_dioxide: 'no2', carbon_dioxide: 'co2', carbon_monoxide: 'co', ruido: 'db', dbo5: 'dbo' }
const UNIT_CONV = { 'mg/m³': 1000, 'mg/m3': 1000 } // a µg/m³

export const STAGES = ['Recibido', 'Normalizado', 'Validado', 'Almacenado']

export async function ingest(records, { source, channel, label }, onStage) {
  const d = db()
  const step = async (i) => { onStage?.(i); await new Promise((r) => setTimeout(r, 380)) }
  await step(0)

  // 1 · Normalización
  const norm = records.map((r, row) => {
    const p = String(r.param || '').toLowerCase().trim()
    const param = ALIAS[p] || p
    let value = typeof r.value === 'string' ? Number(r.value.replace(',', '.')) : r.value
    const unit = (r.unit || '').trim()
    if (UNIT_CONV[unit] && PARAMS[param]?.unit === 'µg/m³') value *= UNIT_CONV[unit]
    const ts = typeof r.ts === 'number' ? r.ts : new Date(r.ts).getTime()
    return { row: row + 1, pointId: String(r.pointId || '').trim().toUpperCase(), param, value, unit, ts }
  })
  await step(1)

  // 2 · Validación
  const errors = []
  const ok = []
  const existing = new Set(d.readings.map((r) => `${r.pointId}|${r.param}|${r.ts}`))
  let duplicates = 0
  for (const r of norm) {
    const pt = d.points.find((p) => p.id === r.pointId)
    const meta = PARAMS[r.param]
    let reason = null
    if (!pt) reason = `Punto "${r.pointId}" no registrado`
    else if (!meta) reason = `Parámetro "${r.param}" no catalogado`
    else if (meta.medium !== pt.type) reason = `${meta.label} no aplica a un punto de ${pt.type}`
    else if (r.value == null || Number.isNaN(r.value)) reason = 'Valor vacío o no numérico'
    else if (r.value < 0) reason = 'Valor negativo'
    else if (Number.isNaN(r.ts)) reason = 'Fecha inválida'
    else if (r.ts > Date.now() + 3600000) reason = 'Fecha futura'
    else if (existing.has(`${r.pointId}|${r.param}|${r.ts}`)) reason = 'duplicado'
    // Lo que ya existía se omite sin contarse como error (re-sincronizar no baja la calidad).
    if (reason === 'duplicado') duplicates++
    else if (reason) errors.push({ row: r.row, reason })
    else {
      existing.add(`${r.pointId}|${r.param}|${r.ts}`)
      ok.push(r)
    }
  }
  await step(2)

  // 3 · Almacenamiento + reglas de negocio (excedencias → hallazgos)
  const rows = ok.map((r) => ({
    id: uid('R'), pointId: r.pointId, param: r.param, value: +Number(r.value).toFixed(2), ts: r.ts, source, channel,
    exceed: isExceed(r.param, r.value),
  }))
  d.readings.push(...rows)
  const exceed = rows.filter((r) => r.exceed)
  const created = []
  for (const r of exceed) {
    const already = d.findings.some((f) => f.status !== 'cerrado' && f.pointId === r.pointId && f.param === r.param)
    if (already || created.some((f) => f.pointId === r.pointId && f.param === r.param)) continue
    const pt = d.points.find((p) => p.id === r.pointId)
    const f = {
      id: uid('H'), title: `Excedencia ${PARAMS[r.param].label} en ${pt.name}`, severity: r.value > PARAMS[r.param].max * 1.3 ? 'alta' : 'media',
      status: 'abierto', origin: 'monitoreo', pointId: r.pointId, param: r.param, due: Date.now() + 7 * 86400000, owner: 'Sin asignar', createdAt: Date.now(),
    }
    d.findings.unshift(f)
    created.push(f)
  }
  const entry = { id: uid('I'), ts: Date.now(), source, channel, label, received: records.length, accepted: rows.length, rejected: errors.length, duplicates, exceedances: exceed.length, findings: created.length, errors }
  d.ingestLog.unshift(entry)
  d.activity.unshift({ id: uid('A'), ts: Date.now(), text: `${label}: ${rows.length} nuevos, ${duplicates} ya existían, ${errors.length} rechazados`, tone: source === 'externa' ? 'ext' : 'int' })
  created.forEach((f) => d.activity.unshift({ id: uid('A'), ts: Date.now(), text: `Hallazgo creado: ${f.title}`, tone: 'danger' }))
  persist()
  await step(3)
  return { ...entry, created }
}
