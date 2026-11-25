// Catálogo de parámetros (espejo de shared/enums/Parametro.java).
// max = límite legal NCAA Ecuador (AM 097-A) para avgHours; who = guía OMS 2021; scale = cortes de color del mapa.
export const PARAMS = {
  pm2_5: { label: 'PM2.5', unit: 'µg/m³', max: 50, who: 15, avgHours: 24, medium: 'aire', norm: 'NCAA 24 h · OMS 15', scale: [15, 35, 50, 150],
    health: 'Partículas finas que llegan a los pulmones y a la sangre; agravan asma y enfermedades cardiovasculares.' },
  pm10: { label: 'PM10', unit: 'µg/m³', max: 100, who: 45, avgHours: 24, medium: 'aire', norm: 'NCAA 24 h · OMS 45', scale: [45, 75, 100, 250],
    health: 'Polvo y partículas gruesas (canteras, vías sin pavimentar, construcción); irritan vías respiratorias.' },
  no2: { label: 'NO₂', unit: 'µg/m³', max: 200, who: 25, avgHours: 1, medium: 'aire', norm: 'NCAA 1 h · OMS 24 h 25', scale: [25, 100, 200, 1000],
    health: 'Gas del tráfico vehicular, sobre todo diésel; inflama las vías respiratorias.' },
  o3: { label: 'O₃', unit: 'µg/m³', max: 100, who: 100, avgHours: 8, medium: 'aire', norm: 'NCAA 8 h · OMS 100', scale: [60, 100, 140, 200],
    health: 'Ozono troposférico: se forma con sol intenso a partir de NOx y COV; provoca tos y reduce la función pulmonar.' },
  so2: { label: 'SO₂', unit: 'µg/m³', max: 125, who: 40, avgHours: 24, medium: 'aire', norm: 'NCAA 24 h · OMS 40', scale: [40, 80, 125, 200],
    health: 'Proviene de combustibles con azufre (diésel, búnker en termoeléctricas).' },
  co: { label: 'CO', unit: 'µg/m³', max: 10000, who: 4000, avgHours: 8, medium: 'aire', norm: 'NCAA 8 h · OMS 24 h 4 000', scale: [4000, 7000, 10000, 15000],
    health: 'Gas de combustión incompleta; reduce el transporte de oxígeno en la sangre.' },
  co2: { label: 'CO₂', unit: 'ppm', max: 500, who: null, avgHours: 1, medium: 'aire', norm: 'Umbral interno (sin norma)', scale: [420, 450, 500, 600],
    health: 'Gas de efecto invernadero; en exteriores no es un contaminante de salud a estos niveles.' },
  ph: { label: 'pH', unit: '', min: 6.5, max: 8.5, avgHours: 1, medium: 'agua', norm: 'Norma de descarga (demo)' },
  dbo: { label: 'DBO₅', unit: 'mg/L', max: 30, avgHours: 1, medium: 'agua', norm: 'Norma de descarga (demo)' },
  sst: { label: 'SST', unit: 'mg/L', max: 50, avgHours: 1, medium: 'agua', norm: 'Norma de descarga (demo)' },
  db: { label: 'Ruido', unit: 'dB(A)', max: 68, avgHours: 1, medium: 'ruido', norm: 'Zona mixta diurna (demo)' },
}

export const MEDIA = {
  aire: { label: 'Aire', params: ['pm2_5', 'pm10', 'no2', 'o3', 'so2', 'co', 'co2'] },
  agua: { label: 'Agua', params: ['ph', 'dbo', 'sst'] },
  ruido: { label: 'Ruido', params: ['db'] },
}

export const AQ_LEVELS = [
  { label: 'Bueno', hint: 'dentro de la guía OMS', color: '#2a8f6a' },
  { label: 'Moderado', hint: 'sobre la guía OMS', color: '#c3b23a' },
  { label: 'Alto', hint: 'cerca del límite legal', color: '#e08a3a' },
  { label: 'Sobre la norma', hint: 'supera la NCAA', color: '#c4443a' },
  { label: 'Nivel de alerta', hint: 'umbral de alerta NCAA', color: '#7a1f3d' },
]
export function aqLevel(param, value) {
  const s = PARAMS[param]?.scale
  if (!s || value == null) return null
  const i = s.findIndex((c) => value <= c)
  return i === -1 ? 4 : i
}

export function isExceed(param, value) {
  const p = PARAMS[param]
  if (!p) return false
  return (p.max != null && value > p.max) || (p.min != null && value < p.min)
}

export function ratio(param, value) {
  const p = PARAMS[param]
  if (!p) return 0
  if (p.min != null) {
    const mid = (p.min + p.max) / 2
    return Math.abs(value - mid) / ((p.max - p.min) / 2)
  }
  return value / p.max
}

export const fmt = (v, d = 1) => (v == null || Number.isNaN(v) ? '—' : Number(v).toLocaleString('es', { maximumFractionDigits: d }))
export const fmtT = (t) => (t == null ? '—' : t >= 1e6 ? `${fmt(t / 1e6, 2)} Mt` : t >= 1e3 ? `${fmt(t / 1e3, 1)} kt` : `${fmt(t, 1)} t`)
export const fmtDate = (ts) => new Date(ts).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
export const fmtTime = (ts) => new Date(ts).toLocaleString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
export const fmtHour = (ts) => new Date(ts).toLocaleString('es', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Guayaquil' })
export const daysUntil = (ts) => Math.ceil((new Date(ts) - Date.now()) / 86400000)
export const ago = (ts) => {
  const s = Math.round((Date.now() - new Date(ts)) / 1000)
  if (s < 60) return `hace ${s}s`
  if (s < 3600) return `hace ${Math.round(s / 60)} min`
  if (s < 86400) return `hace ${Math.round(s / 3600)} h`
  return `hace ${Math.round(s / 86400)} d`
}
