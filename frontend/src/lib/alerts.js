import { PARAMS, daysUntil, fmt } from './params'

// Umbrales oficiales de ALERTA de la NCAA (AM 097-A, 4.1.3 Tabla 1), µg/m³.
const ALERTA_NCAA = { pm2_5: 150, pm10: 250, no2: 1000, o3: 200, so2: 200, co: 15000 }
export const NIVELES = {
  critica: { label: 'Crítica', color: '#7a1f3d', bg: 'bg-[#7a1f3d]', soft: 'bg-rose-50 text-rose-900 border-rose-200', orden: 0 },
  alta: { label: 'Alta', color: '#b42318', bg: 'bg-danger', soft: 'bg-red-50 text-red-800 border-red-200', orden: 1 },
  media: { label: 'Atención', color: '#d97706', bg: 'bg-amber-500', soft: 'bg-amber-50 text-amber-900 border-amber-200', orden: 2 },
  info: { label: 'Aviso', color: '#2563a8', bg: 'bg-blue-600', soft: 'bg-blue-50 text-blue-900 border-blue-200', orden: 3 },
}
export const CATEGORIAS = {
  aire: { label: 'Calidad del aire' }, agua: { label: 'Agua y ruido' }, cumplimiento: { label: 'Permisos y normas' }, gestion: { label: 'Gestión' },
}
const CANAL = { remmaq: 'Dato oficial REMMAQ', api: 'Modelo Open-Meteo', sensor: 'Sensor interno', formulario: 'Formulario', laboratorio: 'Laboratorio', demo: 'Demo' }

export function latestByPointParam(readings) {
  const m = new Map()
  for (const r of readings) {
    const k = `${r.pointId}|${r.param}`
    const cur = m.get(k)
    if (!cur || r.ts > cur.ts) m.set(k, r)
  }
  return m
}

/** Promedio del período normativo (24 h, 8 h o 1 h) que termina en la última lectura de cada punto/parámetro/origen. */
export function promediosNormativos(readings) {
  const grupos = new Map()
  for (const r of readings) {
    const origen = r.channel === 'remmaq' ? 'oficial' : r.channel === 'api' ? 'modelo' : 'interno'
    const k = `${r.pointId}|${r.param}|${origen}`
    if (!grupos.has(k)) grupos.set(k, [])
    grupos.get(k).push(r)
  }
  const out = []
  for (const [k, rs] of grupos) {
    const [pointId, param, origen] = k.split('|')
    const p = PARAMS[param]
    if (!p) continue
    const last = rs.reduce((a, b) => (b.ts > a.ts ? b : a))
    const desde = last.ts - (p.avgHours || 1) * 3600000
    const win = rs.filter((r) => r.ts > desde && r.ts <= last.ts)
    const avg = win.reduce((s, r) => s + r.value, 0) / win.length
    out.push({ pointId, param, origen, channel: last.channel, ts: last.ts, avg, n: win.length, horas: p.avgHours || 1 })
  }
  return out
}

export function computeAlerts(data) {
  if (!data) return []
  const out = []
  const pts = Object.fromEntries(data.points.map((p) => [p.id, p]))
  const proms = promediosNormativos(data.readings)

  // Aire: norma legal por estación; guía OMS agrupada por contaminante para no saturar.
  const sobreOms = {}
  for (const x of proms) {
    const p = PARAMS[x.param]
    const pt = pts[x.pointId]
    if (!pt || p.medium !== 'aire' || x.param === 'co2') continue
    const base = { kind: 'aire', ts: x.ts, value: x.avg, limit: p.max, who: p.who, unit: p.unit, param: x.param, pointId: x.pointId, to: 'mapa', ref: x.pointId,
      fuente: CANAL[x.channel] || x.channel, stale: Date.now() - x.ts > 6 * 3600000, avgLabel: `promedio ${x.horas} h` }
    if (x.avg > (ALERTA_NCAA[x.param] ?? Infinity)) {
      out.push({ ...base, id: `A-${x.pointId}-${x.param}-${x.origen}`, level: 'critica', title: `${p.label} en nivel de ALERTA en ${pt.name}`,
        what: `El ${base.avgLabel} llegó a ${fmt(x.avg, 1)} ${p.unit}, sobre el umbral de alerta de la norma (${fmt(ALERTA_NCAA[x.param], 0)}).`,
        why: `${p.health} La norma obliga a la autoridad a activar el plan de alerta.`,
        action: 'Notificar a la Secretaría de Ambiente, restringir actividades al aire libre y registrar un hallazgo.' })
    } else if (x.avg > p.max) {
      out.push({ ...base, id: `A-${x.pointId}-${x.param}-${x.origen}`, level: 'alta', title: `${p.label} supera la norma ecuatoriana en ${pt.name}`,
        what: `El ${base.avgLabel} es ${fmt(x.avg, 1)} ${p.unit}; el límite legal (NCAA) es ${fmt(p.max, 0)} ${p.unit}.`,
        why: p.health, action: 'Revisar fuentes cercanas en el mapa, abrir un hallazgo y documentar evidencias.' })
    } else if (p.who != null && x.avg > p.who && p.avgHours >= 8) {
      ;(sobreOms[x.param] ||= []).push({ ...x, nombre: pt.name, base })
    }
  }
  for (const [param, lista] of Object.entries(sobreOms)) {
    const p = PARAMS[param]
    const peor = lista.reduce((a, b) => (b.avg > a.avg ? b : a))
    out.push({ ...peor.base, id: `OMS-${param}`, level: 'media', value: peor.avg, pointId: peor.pointId, ref: peor.pointId,
      title: `${p.label} sobre la guía de salud de la OMS en ${lista.length} estación${lista.length > 1 ? 'es' : ''}`,
      what: `Dentro de la norma legal, pero sobre la guía OMS (${p.who} ${p.unit}). Valor más alto: ${peor.nombre}, ${fmt(peor.avg, 1)} ${p.unit}.`,
      why: `${p.health} La OMS recomienda no superar este valor para proteger la salud.`,
      action: 'Informar a grupos sensibles (niños, adultos mayores, personas con asma) y vigilar la tendencia.',
      detalle: lista.map((l) => `${l.nombre}: ${fmt(l.avg, 1)}`).join(' · ') })
  }

  // Agua y ruido (puntos propios)
  for (const r of latestByPointParam(data.readings).values()) {
    const p = PARAMS[r.param]
    const pt = pts[r.pointId]
    if (!pt || !p || p.medium === 'aire' || !r.exceed) continue
    out.push({ id: `W-${r.pointId}-${r.param}`, kind: 'agua', level: 'alta', ts: r.ts, value: r.value, limit: p.max, min: p.min, unit: p.unit, param: r.param, pointId: r.pointId,
      to: 'monitoreo', ref: r.pointId, fuente: CANAL[r.channel] || r.channel, stale: false, avgLabel: 'última lectura',
      title: `${p.label} fuera de rango en ${pt.name}`,
      what: `Última lectura: ${fmt(r.value, 2)} ${p.unit} (permitido ${p.min != null ? `${p.min}–` : '≤ '}${p.max}).`,
      why: pt.type === 'agua' ? 'Una descarga fuera de norma afecta la vida acuática y puede generar sanciones.' : 'El ruido sobre el límite afecta el descanso y la salud de los vecinos.',
      action: 'Verificar con una nueva muestra, revisar el proceso y abrir un hallazgo.' })
  }

  // Cumplimiento: vencimientos
  for (const q of data.requirements) {
    if (!q.expires) continue
    const d = daysUntil(q.expires)
    const base = { kind: 'cumplimiento', ts: q.expires, to: 'cumplimiento', fuente: 'Núcleo de datos', stale: false }
    if (d < 0) out.push({ ...base, id: `V-${q.id}`, level: 'alta', title: `Venció: ${q.title}`, what: `Venció hace ${-d} días.`, why: 'Operar con un permiso vencido expone a sanciones y suspensión.', action: 'Iniciar la renovación y adjuntar el comprobante como evidencia.', dias: d })
    else if (d <= 30) out.push({ ...base, id: `V-${q.id}`, level: 'media', title: `Vence en ${d} días: ${q.title}`, what: `Fecha límite: ${new Date(q.expires).toLocaleDateString('es')}.`, why: 'Los trámites de renovación suelen tardar semanas.', action: 'Preparar la documentación y asignar un responsable.', dias: d })
    else if (d <= 60) out.push({ ...base, id: `V-${q.id}`, level: 'info', title: `Próximo vencimiento: ${q.title}`, what: `Vence en ${d} días.`, why: 'Planificar con tiempo evita apuros.', action: 'Agendar la renovación.', dias: d })
  }
  // Gestión: hallazgos atrasados y quejas sin respuesta
  for (const f of data.findings) {
    if (f.status !== 'cerrado' && f.due < Date.now()) out.push({ id: `F-${f.id}`, kind: 'gestion', level: 'media', ts: f.due, to: 'hallazgos', fuente: 'Núcleo de datos', title: `Hallazgo atrasado: ${f.title}`, what: `Responsable: ${f.owner}. Fecha comprometida vencida hace ${-daysUntil(f.due)} días.`, why: 'Las no conformidades abiertas se observan en auditorías y ante la autoridad.', action: 'Actualizar el estado o reprogramar con justificación.' })
  }
  for (const c of data.complaints) {
    if (c.status !== 'cerrada' && Date.now() - c.ts > 7 * 86400000) out.push({ id: `Q-${c.id}`, kind: 'gestion', level: 'media', ts: c.ts, to: 'relaciones', fuente: 'Núcleo de datos', title: `Queja sin respuesta: ${c.subject}`, what: `Recibida hace ${Math.round((Date.now() - c.ts) / 86400000)} días.`, why: 'Responder a tiempo mantiene la confianza de la comunidad.', action: 'Contactar al remitente y registrar la gestión.' })
  }
  return out.sort((a, b) => NIVELES[a.level].orden - NIVELES[b.level].orden || b.ts - a.ts)
}
