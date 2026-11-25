// Composición de la SPA: rutas (React Router), guardias de sesión y rol, layout y transiciones.
// Vista = pages/*, estado y acciones = store.jsx, acceso a la API = api/* (separación tipo MVC).
import { useEffect, useRef, useState } from 'react'
import { HashRouter, Navigate, NavLink, Route, Routes, useLocation, useSearchParams } from 'react-router'
import { AnimatePresence, motion } from 'motion/react'
import {
  Workflow, Globe, Database, ShieldCheck, Activity, TriangleAlert, Users, LayoutDashboard, FileText,
  Leaf, Bell, RefreshCw, Radio, Menu, X, Shuffle, Map as MapIcon, BookOpen, Server, HardDrive, UserCog, LogOut, ChevronDown, Compass,
} from 'lucide-react'
import { useStore } from './store'
import { Button, spring } from './components/ui'
import { FuentesProvider } from './components/Fuentes'
import Flujo from './pages/Flujo'
import Fuentes from './pages/Fuentes'
import Integracion from './pages/Integracion'
import Nucleo from './pages/Nucleo'
import Cumplimiento from './pages/Cumplimiento'
import Monitoreo from './pages/Monitoreo'
import Hallazgos from './pages/Hallazgos'
import Relaciones from './pages/Relaciones'
import Tableros from './pages/Tableros'
import Reportes from './pages/Reportes'
import MapaQuito from './pages/MapaQuito'
import FuentesDatos from './pages/FuentesDatos'
import Login from './pages/Login'
import Usuarios from './pages/Usuarios'

export const NAV = [
  { group: 'Visión', items: [
    { id: 'flujo', label: 'Flujo de datos', icon: Workflow, page: Flujo },
    { id: 'mapa', label: 'Mapa de Quito', icon: MapIcon, page: MapaQuito, tone: 'ext' },
    { id: 'datos', label: 'Fuentes de información', icon: BookOpen, page: FuentesDatos },
  ] },
  { group: 'Entrada', items: [
    { id: 'fuentes', label: 'Fuentes', icon: Globe, page: Fuentes, tone: 'ext' },
    { id: 'integracion', label: 'Integración y validación', icon: Shuffle, page: Integracion },
  ] },
  { group: 'Núcleo', items: [{ id: 'nucleo', label: 'Núcleo de datos', icon: Database, page: Nucleo }] },
  { group: 'Módulos', items: [
    { id: 'cumplimiento', label: 'Cumplimiento', icon: ShieldCheck, page: Cumplimiento, tone: 'int' },
    { id: 'monitoreo', label: 'Monitoreo', icon: Activity, page: Monitoreo, tone: 'int' },
    { id: 'hallazgos', label: 'Hallazgos', icon: TriangleAlert, page: Hallazgos, tone: 'int' },
    { id: 'relaciones', label: 'Relaciones', icon: Users, page: Relaciones, tone: 'ext' },
  ] },
  { group: 'Salida', items: [
    { id: 'tableros', label: 'Tableros y alertas', icon: LayoutDashboard, page: Tableros },
    { id: 'reportes', label: 'Reportes y portal', icon: FileText, page: Reportes, tone: 'ext' },
  ] },
  { group: 'Administración', permiso: 'administrar', soloApi: true, items: [
    { id: 'usuarios', label: 'Usuarios y roles', icon: UserCog, page: Usuarios },
  ] },
]
const ALL = NAV.flatMap((g) => g.items)

function Sidebar({ onNav }) {
  const { pendientes: alerts, data, puede, mode } = useStore()
  const grupos = NAV.filter((g) => (!g.permiso || puede(g.permiso)) && (!g.soloApi || mode === 'api'))
  const counts = {
    hallazgos: data?.findings.filter((f) => f.status !== 'cerrado').length,
    tableros: alerts.length,
    relaciones: data?.complaints.filter((c) => c.status !== 'cerrada').length,
  }
  return (
    <nav className="flex h-full flex-col gap-5 overflow-y-auto p-4 scroll-thin">
      <NavLink to="/flujo" onClick={onNav} className="flex items-center gap-2.5 px-2 pt-1">
        <motion.div whileHover={{ rotate: -12, scale: 1.08 }} className="grid size-9 place-items-center rounded-xl bg-int-700 text-int-50"><Leaf className="size-5" /></motion.div>
        <div>
          <p className="text-[15px] leading-tight font-semibold">EcoTrace</p>
          <p className="text-[11px] text-muted">CRM ambiental</p>
        </div>
      </NavLink>
      {grupos.map((g) => (
        <div key={g.group}>
          <p className="mb-1.5 px-2 text-[10px] font-semibold tracking-[.16em] text-muted uppercase">{g.group}</p>
          {g.items.map((it) => (
            <NavLink key={it.id} to={`/${it.id}`} onClick={onNav} className={({ isActive }) => `relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm transition-colors ${isActive ? 'text-ink' : 'text-muted hover:text-ink'}`}>
              {({ isActive }) => (
                <>
                  {isActive && <motion.span layoutId="nav-active" transition={spring} className="absolute inset-0 rounded-xl border border-line bg-white shadow-sm" />}
                  <it.icon className={`relative size-4 ${it.tone === 'ext' ? 'text-ext-500' : it.tone === 'int' ? 'text-int-500' : ''}`} />
                  <span className="relative flex-1">{it.label}</span>
                  {!!counts[it.id] && <span className="relative rounded-full bg-ink/90 px-1.5 text-[10px] font-semibold text-white tabular-nums">{counts[it.id]}</span>}
                </>
              )}
            </NavLink>
          ))}
        </div>
      ))}
      <div className="mt-auto rounded-2xl border border-line bg-white/70 p-3 text-xs text-muted">
        <p className="font-medium text-ink">Leyenda</p>
        <p className="mt-1.5 flex items-center gap-2"><span className="size-2.5 rounded bg-int-300" />Gestión interna</p>
        <p className="mt-1 flex items-center gap-2"><span className="size-2.5 rounded bg-ext-300" />Partes externas</p>
      </div>
    </nav>
  )
}

function MenuUsuario() {
  const { sesion, logout, mode } = useStore()
  const [abierto, setAbierto] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const cerrar = (e) => { if (!ref.current?.contains(e.target)) setAbierto(false) }
    document.addEventListener('mousedown', cerrar)
    return () => document.removeEventListener('mousedown', cerrar)
  }, [])
  if (!sesion) return null
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setAbierto(!abierto)} className="flex items-center gap-2 rounded-xl border border-line bg-white py-1 pr-2 pl-1 hover:bg-stone-50" aria-label="Menú de usuario">
        <span className="grid size-8 place-items-center rounded-lg bg-int-700 text-xs font-bold text-white">{sesion.iniciales}</span>
        <span className="hidden text-left md:block"><span className="block text-xs leading-tight font-semibold">{sesion.nombre}</span><span className="block text-[10px] text-muted">{sesion.rolDescripcion}</span></span>
        <motion.span animate={{ rotate: abierto ? 180 : 0 }}><ChevronDown className="size-4 text-muted" /></motion.span>
      </button>
      <AnimatePresence>
        {abierto && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={spring}
            className="absolute top-full right-0 mt-2 w-64 origin-top-right rounded-2xl border border-line bg-white p-2 shadow-xl">
            <div className="px-3 py-2">
              <p className="text-sm font-semibold">{sesion.nombre}</p>
              <p className="text-xs text-muted">@{sesion.username} · {sesion.rolDescripcion}</p>
              <p className="mt-2 flex flex-wrap gap-1">{sesion.permisos?.map((p) => <span key={p} className="rounded-full bg-int-50 px-2 py-0.5 text-[10px] font-medium text-int-700">{p}</span>)}</p>
            </div>
            <button onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
              <LogOut className="size-4" />{mode === 'api' ? 'Cerrar sesión' : 'Salir del modo local'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Topbar({ onMenu }) {
  const { live, setLive, syncExternal, syncing, pendientes: alerts, mode, puede } = useStore()
  return (
    <header className="print:hidden sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-paper/80 px-4 py-3 backdrop-blur-md md:px-8">
      <button className="rounded-lg p-2 hover:bg-stone-100 lg:hidden" onClick={onMenu} aria-label="Menú"><Menu className="size-5" /></button>
      <div className="flex-1">
        {mode && (
          <motion.span initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} title={mode === 'api' ? 'Conectado a la API Spring Boot' : 'Sin backend: datos guardados en este navegador'}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${mode === 'api' ? 'border-int-300 bg-int-50 text-int-700' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
            {mode === 'api' ? <Server className="size-3.5" /> : <HardDrive className="size-3.5" />}<span className="hidden sm:inline">{mode === 'api' ? 'API Spring Boot' : 'Modo local'}</span>
          </motion.span>
        )}
      </div>
      {puede('editar') && <motion.button
        onClick={() => setLive(!live)}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${live ? 'border-int-300 bg-int-50 text-int-700' : 'border-line bg-white text-muted'}`}
      >
        <span className="relative flex size-2.5">
          {live && <span className="absolute inline-flex size-full animate-ping rounded-full bg-int-500 opacity-60" />}
          <span className={`relative inline-flex size-2.5 rounded-full ${live ? 'bg-int-500' : 'bg-stone-300'}`} />
        </span>
        <Radio className="size-4" /> <span className="hidden xl:inline">Sensores {live ? 'en vivo' : 'pausados'}</span>
      </motion.button>}
      {puede('editar') && <Button variant="ext" icon={RefreshCw} loading={syncing} onClick={syncExternal}>
        <span className="hidden xl:inline">{syncing ? 'Sincronizando…' : 'Sincronizar API externa'}</span>
      </Button>}
      <a href="#/tableros" className="relative rounded-xl border border-line bg-white p-2 hover:bg-stone-50" aria-label="Alertas">
        <Bell className="size-5" />
        <AnimatePresence>
          {alerts.length > 0 && (
            <motion.span key={alerts.length} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring} className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-danger text-[10px] font-bold text-white">
              {alerts.length}
            </motion.span>
          )}
        </AnimatePresence>
      </a>
      <MenuUsuario />
    </header>
  )
}

function Toasts() {
  const { toasts } = useStore()
  const tone = { int: 'border-int-300 bg-int-50 text-int-900', ext: 'border-ext-300 bg-ext-50 text-ext-900', warn: 'border-amber-200 bg-amber-50 text-amber-900', danger: 'border-red-200 bg-red-50 text-red-800' }
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(92vw,360px)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} layout initial={{ opacity: 0, x: 60, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }} transition={spring}
            className={`rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${tone[t.tone] || tone.int}`}>
            {t.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function Loader() {
  return (
    <div className="grid h-full place-items-center">
      <div className="flex flex-col items-center gap-4">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }} className="size-10 rounded-full border-4 border-int-100 border-t-int-700" />
        <p className="text-sm text-muted">Conectando con el núcleo de datos…</p>
      </div>
    </div>
  )
}

/** Pasa los parámetros de la URL (?p=P-BEL) a las páginas que los usan. */
function ConQuery({ page: Page }) {
  const [sp] = useSearchParams()
  return <Page query={sp} />
}

/** Guardia de rol: sin el permiso, redirige al inicio en vez de mostrar una página vacía. */
function RequierePermiso({ permiso, children }) {
  const { puede } = useStore()
  return puede(permiso) ? children : <Navigate to="/flujo" replace />
}

function NoEncontrada() {
  return (
    <div className="grid place-items-center py-24 text-center">
      <motion.div initial={{ rotate: -30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={spring}><Compass className="size-12 text-muted" /></motion.div>
      <h1 className="mt-4 text-2xl font-semibold">Esta página no existe</h1>
      <p className="mt-1 text-sm text-muted">Revisa la dirección o vuelve al flujo principal.</p>
      <NavLink to="/flujo" className="mt-5 rounded-xl bg-ink px-4 py-2 text-sm font-medium text-white">Ir al inicio</NavLink>
    </div>
  )
}

function Layout() {
  const location = useLocation()
  const { data } = useStore()
  const [menu, setMenu] = useState(false)
  useEffect(() => { document.querySelector('main')?.scrollTo({ top: 0 }) }, [location.pathname])
  const rutas = NAV.flatMap((g) => g.items.map((it) => ({ ...it, permiso: g.permiso })))

  return (
    <FuentesProvider>
    <motion.div className="flex h-full" initial={{ opacity: 0, scale: 0.985 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
      <aside className="hidden print:!hidden w-64 shrink-0 border-r border-line bg-paper lg:block"><Sidebar /></aside>
      <AnimatePresence>
        {menu && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-ink/30" onClick={() => setMenu(false)} />
            <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={spring} className="absolute inset-y-0 left-0 w-64 bg-paper shadow-xl">
              <button className="absolute top-4 right-3 rounded-lg p-1.5 hover:bg-stone-100" onClick={() => setMenu(false)} aria-label="Cerrar menú"><X className="size-4" /></button>
              <Sidebar onNav={() => setMenu(false)} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
      <main className="relative flex-1 overflow-y-auto scroll-thin">
        <Topbar onMenu={() => setMenu(true)} />
        {!data ? <Loader /> : (
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial="hidden" animate="show" exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }} variants={{ hidden: {}, show: { transition: { staggerChildren: 0.045 } } }} className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
              <Routes location={location}>
                <Route path="/" element={<Navigate to="/flujo" replace />} />
                {rutas.map((r) => (
                  <Route key={r.id} path={`/${r.id}`} element={r.permiso ? <RequierePermiso permiso={r.permiso}><ConQuery page={r.page} /></RequierePermiso> : <ConQuery page={r.page} />} />
                ))}
                <Route path="*" element={<NoEncontrada />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        )}
      </main>
      <Toasts />
    </motion.div>
    </FuentesProvider>
  )
}

function Splash() {
  return (
    <div className="grid h-full place-items-center bg-paper">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring} className="flex flex-col items-center gap-3">
        <motion.div animate={{ rotate: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 1.6 }} className="grid size-14 place-items-center rounded-2xl bg-int-700 text-white"><Leaf className="size-7" /></motion.div>
        <p className="text-sm text-muted">Verificando sesión…</p>
      </motion.div>
    </div>
  )
}

export default function App() {
  const { estadoAuth } = useStore()
  return (
    <HashRouter>
      <AnimatePresence mode="wait">
        {estadoAuth === 'cargando' && <motion.div key="splash" className="h-full" exit={{ opacity: 0 }}><Splash /></motion.div>}
        {estadoAuth === 'anonimo' && <motion.div key="login" className="h-full" exit={{ opacity: 0 }}><Login /><Toasts /></motion.div>}
        {estadoAuth === 'autenticado' && <motion.div key="app" className="h-full"><Layout /></motion.div>}
      </AnimatePresence>
    </HashRouter>
  )
}
