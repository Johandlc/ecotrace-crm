import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { internalApi } from './api/internal'
import { alPerderSesion } from './api/http'
import { computeAlerts } from './lib/alerts'
import { MEDIA } from './lib/params'

const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)

/** Sesión ficticia del modo local (sin backend): todos los permisos, datos sólo en este navegador. */
const SESION_LOCAL = { username: 'local', nombre: 'Modo local', iniciales: 'ML', rol: 'ADMIN', rolDescripcion: 'Sin servidor', permisos: ['consultar', 'editar', 'administrar'] }

/**
 * Estado global de la SPA (patrón "store" con Context):
 *  - autenticación: estadoAuth = 'cargando' | 'anonimo' | 'autenticado', sesion, login/logout, puede()
 *  - núcleo de datos (snapshot), ingesta, sincronización externa, alertas
 * Las vistas (pages) sólo leen de aquí y llaman acciones; la API concreta queda en api/internal.js.
 */
export function StoreProvider({ children }) {
  const [data, setData] = useState(null)
  const [mode, setMode] = useState(null)
  const [estadoAuth, setEstadoAuth] = useState('cargando')
  const [sesion, setSesion] = useState(null)
  const [toasts, setToasts] = useState([])
  const [stage, setStage] = useState(-1)
  const [pulse, setPulse] = useState({ at: 0, source: null })
  const [live, setLive] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const busy = useRef(false)

  const toast = useCallback((text, tone = 'int') => {
    const id = Math.random()
    setToasts((t) => [...t, { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])

  const refresh = useCallback(async () => setData(await internalApi.snapshot()), [])

  // Arranque: detectar backend y, si ya hay una sesión válida (cookie), entrar directo.
  useEffect(() => {
    internalApi.init().then(async (m) => {
      setMode(m)
      if (m === 'api') {
        try {
          setSesion(await internalApi.sesion())
          setEstadoAuth('autenticado')
          await refresh()
          return
        } catch { /* sin sesión: mostrar login */ }
      }
      setEstadoAuth('anonimo')
    })
  }, [refresh])

  // Si el servidor responde 401 en medio del uso, la sesión expiró: volver al login.
  useEffect(() => alPerderSesion(() => {
    setEstadoAuth((e) => (e === 'autenticado' ? 'anonimo' : e))
    setSesion(null)
    toast('Tu sesión expiró. Vuelve a ingresar.', 'warn')
  }), [toast])

  /**
   * Inicia sesión y precarga el núcleo; NO cambia de pantalla todavía para que el login pueda
   * mostrar su animación de éxito. Luego la vista llama a confirmarIngreso().
   * Lanza ApiError (401 con intentosRestantes, 423 con hasta) para que el login lo anime.
   */
  const login = useCallback(async (username, password) => {
    const s = await internalApi.login(username, password)
    setSesion(s)
    await refresh()
    return s
  }, [refresh])

  const entrarModoLocal = useCallback(async () => {
    setSesion(SESION_LOCAL)
    await refresh()
  }, [refresh])

  const confirmarIngreso = useCallback(() => setEstadoAuth('autenticado'), [])

  const logout = useCallback(async () => {
    if (mode === 'api') { try { await internalApi.logout() } catch { /* ya expiró */ } }
    setSesion(null)
    setData(null)
    setEstadoAuth('anonimo')
  }, [mode])

  /** ¿El usuario actual tiene el permiso? ('consultar' | 'editar' | 'administrar') */
  const puede = useCallback((permiso) => !!sesion?.permisos?.includes(permiso), [sesion])

  const afterIngest = useCallback(async (res, meta, quiet) => {
    await refresh()
    if (!quiet) {
      setTimeout(() => setStage(-1), 1800)
      toast(`${meta.label}: ${res.accepted} nuevos${res.duplicates ? ` · ${res.duplicates} ya existían` : ''} · ${res.rejected} rechazados`, res.rejected ? 'warn' : meta.source === 'externa' ? 'ext' : 'int')
    }
    if (res.created?.length) toast(`${res.created.length} hallazgo(s) generado(s) por excedencia`, 'danger')
    return res
  }, [refresh, toast])

  const runIngest = useCallback(async (records, meta, { quiet } = {}) => {
    setPulse({ at: Date.now(), source: meta.source })
    try {
      const res = await internalApi.ingest(records, meta, quiet ? undefined : setStage)
      return await afterIngest(res, meta, quiet)
    } catch (e) {
      setStage(-1)
      toast(e.message, 'danger')
    }
  }, [afterIngest, toast])

  const syncExternal = useCallback(async () => {
    if (!data || syncing) return
    setSyncing(true)
    setPulse({ at: Date.now(), source: 'externa' })
    try {
      const res = await internalApi.syncAirQuality(data.points, setStage)
      return await afterIngest(res, { source: 'externa', label: 'Open-Meteo · Calidad del aire' })
    } catch (e) {
      setStage(-1)
      toast(e.message, 'danger')
    } finally {
      setSyncing(false)
    }
  }, [data, syncing, afterIngest, toast])

  // Flujo de sensores en vivo (fuente interna, simulada)
  useEffect(() => {
    // Sólo quien puede editar genera lecturas simuladas (un LECTOR recibiría 403).
    if (!live || !data || !sesion?.permisos?.includes('editar')) return
    const id = setInterval(async () => {
      if (busy.current) return
      busy.current = true
      const pts = data.points.filter((p) => p.type !== 'agua')
      const pt = pts[Math.floor(Math.random() * pts.length)]
      const base = { pm2_5: 18, pm10: 34, no2: 45, o3: 30, so2: 4, co: 700, co2: 450, db: 60 }
      const recs = MEDIA[pt.type].params.map((param) => ({
        pointId: pt.id, param, ts: Date.now(),
        value: +(base[param] * (0.7 + Math.random() * (Math.random() < 0.12 ? 1.2 : 0.55))).toFixed(1),
      }))
      await runIngest(recs, { source: 'interna', channel: 'sensor', label: `Sensor ${pt.id}` }, { quiet: true })
      busy.current = false
    }, 2600)
    return () => clearInterval(id)
  }, [live, data, runIngest, sesion])

  const crud = useMemo(() => {
    const wrap = (fn) => async (...args) => {
      try { return await fn(...args) } catch (e) { toast(e.message, 'danger') }
    }
    return {
      create: wrap(async (col, row, msg) => { const r = await internalApi.create(col, row); if (msg) { internalApi.log(msg, 'int'); toast(msg) } await refresh(); return r }),
      update: wrap(async (col, id, patch, msg) => { const r = await internalApi.update(col, id, patch); if (msg) { internalApi.log(msg); toast(msg) } await refresh(); return r }),
      remove: wrap(async (col, id, msg) => { await internalApi.remove(col, id); if (msg) { internalApi.log(msg, 'danger'); toast(msg, 'warn') } await refresh() }),
    }
  }, [refresh, toast])

  const alerts = useMemo(() => computeAlerts(data), [data])
  // Alertas marcadas como revisadas por este usuario (preferencia local del navegador).
  const [revisadas, setRevisadas] = useState(() => { try { return new Set(JSON.parse(localStorage.getItem('ecotrace-revisadas') || '[]')) } catch { return new Set() } })
  const toggleRevisada = useCallback((id) => setRevisadas((s) => {
    const n = new Set(s)
    if (n.has(id)) n.delete(id); else n.add(id)
    try { localStorage.setItem('ecotrace-revisadas', JSON.stringify([...n])) } catch { /* sin almacenamiento */ }
    return n
  }), [])
  const pendientes = useMemo(() => alerts.filter((a) => !revisadas.has(a.id)), [alerts, revisadas])

  const value = { data, mode, estadoAuth, sesion, login, logout, entrarModoLocal, confirmarIngreso, puede, portada: internalApi.portada, refresh, toast, toasts, stage, pulse, live, setLive, syncing, syncExternal, runIngest, alerts, pendientes, revisadas, toggleRevisada, api: internalApi, ...crud }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
