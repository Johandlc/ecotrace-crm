// Fuentes externas: API pública Open-Meteo (calidad del aire, CAMS), feed regulatorio y laboratorios.
const OM = 'https://air-quality-api.open-meteo.com/v1/air-quality'
const MAP = { pm2_5: 'pm2_5', pm10: 'pm10', nitrogen_dioxide: 'no2', carbon_dioxide: 'co2', carbon_monoxide: 'co' }

export async function fetchAirQuality(point, { hours = 12 } = {}) {
  const url = `${OM}?latitude=${point.lat}&longitude=${point.lon}&hourly=${Object.keys(MAP).join(',')}&past_days=1&forecast_days=1&timezone=GMT`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open-Meteo respondió ${res.status}`)
  const json = await res.json()
  const now = Date.now()
  const out = []
  json.hourly.time.forEach((t, i) => {
    const ts = new Date(`${t}Z`).getTime()
    if (ts > now || ts < now - hours * 3600000) return
    Object.entries(MAP).forEach(([k, param]) => {
      if (param === 'co') return // CO se consulta pero no se monitorea en estos puntos
      out.push({ pointId: point.id, param: k, value: json.hourly[k][i], unit: json.hourly_units[k], ts })
    })
  })
  return out
}

const NOTICES = [
  { title: 'Resolución 0412: nuevo límite PM2.5 de 15 µg/m³ (anual)', kind: 'norma', obligations: 'Ajustar umbrales de monitoreo y plan de reducción.' },
  { title: 'Circular: reporte semestral de emisiones de CO₂e obligatorio', kind: 'norma', obligations: 'Presentar inventario GEI cada 6 meses.' },
  { title: 'Requerimiento de información: descargas PTAR últimos 90 días', kind: 'permiso', obligations: 'Entregar resultados de laboratorio y cadenas de custodia.' },
]
export async function fetchAuthorityFeed() {
  await new Promise((r) => setTimeout(r, 700))
  return NOTICES[Math.floor(Math.random() * NOTICES.length)]
}

export function sampleLabCsv() {
  const t = new Date(Date.now() - 2 * 3600000).toISOString().slice(0, 16) + 'Z'
  return [
    'punto,parametro,valor,unidad,fecha',
    `P-MAC,ph,7.1,,${t}`,
    `P-MAC,dbo,34.2,mg/L,${t}`,
    `P-MAC,sst,41,mg/L,${t}`,
    `P-SPE,ph,6.9,,${t}`,
    `P-SPE,dbo,12.5,mg/L,${t}`,
    `P-SPE,sst,-3,mg/L,${t}`,
    `P-ZZZ,ph,7.0,,${t}`,
    `P-SPE,turbiedad,12,NTU,${t}`,
  ].join('\n')
}

export function parseCsv(text) {
  const [head, ...rows] = text.trim().split(/\r?\n/)
  const cols = head.split(',').map((c) => c.trim().toLowerCase())
  return rows.filter(Boolean).map((line) => {
    const v = line.split(',').map((x) => x.trim())
    const o = Object.fromEntries(cols.map((c, i) => [c, v[i]]))
    return { pointId: o.punto, param: o.parametro, value: o.valor, unit: o.unidad, ts: o.fecha }
  })
}

const CUR = { pm2_5: 'pm2_5', pm10: 'pm10', nitrogen_dioxide: 'no2', carbon_dioxide: 'co2', carbon_monoxide: 'co', us_aqi: 'us_aqi' }
// Valores actuales para varias coordenadas en una sola petición (modo local del mapa).
export async function fetchCurrentAir(zones) {
  const url = `${OM}?latitude=${zones.map((z) => z.lat).join(',')}&longitude=${zones.map((z) => z.lon).join(',')}&current=${Object.keys(CUR).join(',')}&timezone=GMT`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Open-Meteo respondió ${res.status}`)
  const json = await res.json()
  const arr = Array.isArray(json) ? json : [json]
  return arr.map((j, i) => ({
    zoneId: zones[i].id,
    ts: new Date(`${j.current.time}Z`).getTime(),
    values: Object.fromEntries(Object.entries(CUR).map(([k, v]) => [v, j.current[k]])),
    source: 'Open-Meteo · CAMS',
  }))
}
