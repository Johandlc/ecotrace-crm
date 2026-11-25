// Fachada de la API interna. Usa el backend Spring Boot si responde; si no, cae al modo local.
import { http, detectBackend } from './http'
import { localApi } from './local'
import { ingest as localIngest } from './integration'
import { fetchAirQuality, fetchAuthorityFeed, fetchCurrentAir } from './external'
import { ZONAS, construirFuentes } from '../data/quito'
import parroquias from '../data/quito-parroquias.json'
import { cargarDataset } from './referencia'

const ROUTES = { stakeholders: 'partes-interesadas', points: 'puntos', requirements: 'requisitos', findings: 'hallazgos', complaints: 'quejas', evidence: 'evidencias' }
const asText = (v) => (v == null ? null : String(v))

export const internalApi = {
  mode: 'local',
  portada: null,
  /** Detecta el backend; si responde guarda la portada pública (dato REMMAQ y cuentas demo). */
  async init() {
    this.portada = await detectBackend()
    this.mode = this.portada ? 'api' : 'local'
    return this.mode
  },
  // ---- Autenticación (sólo modo API) ----
  login: (username, password) => http.post('/auth/login', { username, password }),
  logout: () => http.post('/auth/logout'),
  sesion: () => http.get('/auth/me'),
  // ---- Administración de usuarios (ADMIN) ----
  usuarios: {
    listar: () => http.get('/usuarios'),
    crear: (u) => http.post('/usuarios', u),
    actualizar: (id, u) => http.patch(`/usuarios/${id}`, u),
    desbloquear: (id) => http.post(`/usuarios/${id}/desbloquear`),
    desactivar: (id) => http.del(`/usuarios/${id}`),
  },
  get remote() { return this.mode === 'api' },

  snapshot() {
    return this.remote ? http.get('/nucleo/snapshot?horas=1080') : localApi.snapshot()
  },
  create(col, data) {
    return this.remote ? http.post(`/${ROUTES[col]}`, data) : localApi.create(col, data)
  },
  update(col, id, patch) {
    return this.remote ? http.patch(`/${ROUTES[col]}/${id}`, patch) : localApi.update(col, id, patch)
  },
  remove(col, id) {
    return this.remote ? http.del(`/${ROUTES[col]}/${id}`) : localApi.remove(col, id)
  },
  log(text, tone) {
    // En modo API la auditoría la registra el backend.
    return this.remote ? Promise.resolve() : localApi.log(text, tone)
  },
  ingest(records, meta, onStage) {
    if (!this.remote) return localIngest(records, meta, onStage)
    const body = { source: meta.source, channel: meta.channel, label: meta.label, records: records.map((r) => ({ pointId: r.pointId, param: r.param, value: asText(r.value), unit: r.unit ?? null, ts: asText(r.ts) })) }
    return withStages(http.post('/integracion/ingesta', body), onStage)
  },
  async syncAirQuality(points, onStage) {
    if (this.remote) return withStages(http.post('/integracion/externa/open-meteo/sincronizar?horas=12'), onStage)
    const batches = await Promise.all(points.filter((p) => p.type === 'aire').map((p) => fetchAirQuality(p).catch(() => [])))
    const records = batches.flat()
    if (!records.length) throw new Error('Sin respuesta de la API externa')
    return localIngest(records, { source: 'externa', channel: 'api', label: 'Open-Meteo · Calidad del aire (CAMS)' }, onStage)
  },
  authorityBulletin() {
    return this.remote ? http.get('/integracion/externa/autoridad/boletin') : fetchAuthorityFeed()
  },
  dataset(nombre) {
    return cargarDataset(nombre, this.remote)
  },
  async territory() {
    if (this.remote) {
      const [zones, sources, air] = await Promise.all([
        http.get('/territorio/zonas'), http.get('/territorio/fuentes-emision'), http.get('/territorio/calidad-aire').catch(() => []),
      ])
      return { zones, sources, air }
    }
    const [ct, air] = await Promise.all([this.dataset('climatetrace-quito'), fetchCurrentAir(ZONAS).catch(() => [])])
    return { zones: ZONAS, sources: construirFuentes(ct, parroquias), air }
  },
}

// El backend valida en una sola llamada; la UI anima las etapas mientras tanto.
async function withStages(promise, onStage) {
  if (!onStage) return promise
  let s = 0
  onStage(0)
  const id = setInterval(() => { s = Math.min(s + 1, 2); onStage(s) }, 380)
  try {
    const res = await promise
    onStage(3)
    return res
  } finally {
    clearInterval(id)
  }
}
