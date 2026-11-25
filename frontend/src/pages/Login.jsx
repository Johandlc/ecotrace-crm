// Pantalla de inicio de sesión "dinámica":
//  · Escena animada: las 65 parroquias de Quito se dibujan trazo a trazo y las estaciones REMMAQ laten.
//  · Datos reales rotando (portada pública del backend + inventario oficial).
//  · Formulario con saludo según la hora, recordar usuario, aviso de Bloq Mayús, sacudida al fallar,
//    intentos restantes, cuenta regresiva de bloqueo y animación de éxito antes de entrar.
//  · Cuentas de demostración que se "escriben" solas (sólo si el backend las publica: perfil dev).
//  · Sin servidor: ofrece entrar en modo local.
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useAnimationControls } from 'motion/react'
import { Leaf, User, Lock, Eye, EyeOff, ArrowRight, Check, ShieldAlert, KeyRound, HardDrive, Wind, Factory, Radio, TrendingDown, Loader2 } from 'lucide-react'
import parroquias from '../data/quito-parroquias.json'
import { PUNTOS } from '../data/quito'
import { useStore } from '../store'
import { spring } from '../components/ui'

// ---------- Proyección simple (equirectangular) del GeoJSON a un lienzo SVG ----------
const W = 600, H = 720
const BOUNDS = (() => {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  parroquias.features.forEach((f) => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).forEach((p) => p[0].forEach(([x, y]) => {
    minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y)
  })))
  return { minX, maxX, minY, maxY }
})()
const ESC = Math.min(W / (BOUNDS.maxX - BOUNDS.minX), H / (BOUNDS.maxY - BOUNDS.minY)) * 0.92
const OX = (W - (BOUNDS.maxX - BOUNDS.minX) * ESC) / 2, OY = (H - (BOUNDS.maxY - BOUNDS.minY) * ESC) / 2
const proy = ([lon, lat]) => [OX + (lon - BOUNDS.minX) * ESC, OY + (BOUNDS.maxY - lat) * ESC]
const PATHS = parroquias.features.map((f) => {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
  const d = polys.map((p) => p[0].filter((_, i) => i % 2 === 0).map((c, i) => `${i ? 'L' : 'M'}${proy(c).map((v) => v.toFixed(1)).join(' ')}`).join('') + 'Z').join('')
  return { id: f.properties.parroquia, d, urbana: f.properties.tipo === 'urbana' }
})
const ESTACIONES = PUNTOS.filter((p) => p.type === 'aire').map((p) => ({ id: p.id, xy: proy([p.lon, p.lat]) }))

const saludo = () => { const h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches' }
const MAX_INTENTOS = 5

function Escena({ portada }) {
  const datos = useMemo(() => [
    portada?.pm25PromedioUltimoDia != null && { icon: Wind, valor: `${portada.pm25PromedioUltimoDia.toLocaleString('es')} µg/m³`, texto: `PM2.5 promedio del último día publicado por la REMMAQ (${portada.estacionesActivas} estaciones)` },
    { icon: Factory, valor: '7,61 Mt CO₂e', texto: 'Inventario oficial de gases de efecto invernadero del DMQ (año base 2015)' },
    { icon: TrendingDown, valor: '40 %', texto: 'de esas emisiones provienen del transporte, la mayor fuente de la ciudad' },
    { icon: Radio, valor: '9 estaciones', texto: 'de la red metropolitana miden el aire de Quito hora por hora' },
  ].filter(Boolean), [portada])
  const [i, setI] = useState(0)
  useEffect(() => { const t = setInterval(() => setI((x) => (x + 1) % datos.length), 4200); return () => clearInterval(t) }, [datos.length])
  const D = datos[i % datos.length]

  return (
    <div className="relative hidden h-full overflow-hidden bg-[#0b3a2c] lg:block">
      <motion.div className="absolute -top-40 -left-40 size-[520px] rounded-full bg-int-500/25 blur-3xl" animate={{ x: [0, 60, 0], y: [0, 40, 0] }} transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }} />
      <motion.div className="absolute -right-32 -bottom-32 size-[460px] rounded-full bg-ext-500/20 blur-3xl" animate={{ x: [0, -50, 0], y: [0, -30, 0] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }} />
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet" aria-hidden>
        {PATHS.map((p, k) => (
          <motion.path key={p.id} d={p.d} fill="#6fbf9f" stroke="#9fe0c6" strokeWidth={p.urbana ? 0.9 : 0.6}
            initial={{ pathLength: 0, fillOpacity: 0, strokeOpacity: 0 }}
            animate={{ pathLength: 1, fillOpacity: p.urbana ? 0.16 : 0.06, strokeOpacity: 0.55 }}
            transition={{ pathLength: { duration: 2.2, delay: 0.2 + k * 0.025, ease: 'easeInOut' }, strokeOpacity: { duration: 0.4, delay: 0.2 + k * 0.025 }, fillOpacity: { duration: 1.2, delay: 1.6 + k * 0.02 } }} />
        ))}
        {ESTACIONES.map((e, k) => (
          <g key={e.id} transform={`translate(${e.xy[0]} ${e.xy[1]})`}>
            <motion.circle r={14} fill="#e8f7f0" initial={{ scale: 0, opacity: 0.5 }} animate={{ scale: [0.3, 1.6], opacity: [0.5, 0] }} transition={{ duration: 2.4, repeat: Infinity, delay: 2.4 + k * 0.3, ease: 'easeOut' }} />
            <motion.circle r={4} fill="#fff" stroke="#0f6b4f" strokeWidth={2} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...spring, delay: 2.2 + k * 0.12 }} />
          </g>
        ))}
      </svg>
      <div className="absolute inset-x-0 top-0 p-10">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex items-center gap-3 text-white">
          <div className="grid size-10 place-items-center rounded-xl bg-white/15 backdrop-blur"><Leaf className="size-5" /></div>
          <div><p className="text-lg font-semibold">EcoTrace</p><p className="text-xs text-white/60">CRM ambiental · Distrito Metropolitano de Quito</p></div>
        </motion.div>
      </div>
      <div className="absolute inset-x-10 bottom-10">
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -12, filter: 'blur(6px)' }} transition={{ duration: 0.5 }}
            className="max-w-md rounded-2xl border border-white/15 bg-white/10 p-5 text-white backdrop-blur-md">
            <D.icon className="size-5 text-int-300" />
            <p className="mt-2 text-3xl font-semibold tracking-tight">{D.valor}</p>
            <p className="mt-1 text-sm text-white/75">{D.texto}</p>
          </motion.div>
        </AnimatePresence>
        <div className="mt-4 flex gap-1.5">{datos.map((_, k) => <motion.span key={k} animate={{ width: k === i % datos.length ? 22 : 6, opacity: k === i % datos.length ? 1 : 0.4 }} className="h-1.5 rounded-full bg-white" />)}</div>
        <p className="mt-4 text-[11px] text-white/45">Fuentes: REMMAQ (Secretaría de Ambiente del DMQ) · PACQ 2020 · OpenStreetMap</p>
      </div>
    </div>
  )
}

function Campo({ icon: Icon, label, type = 'text', value, onChange, autoComplete, error, derecha, inputRef, onKeyUp, disabled }) {
  const [foco, setFoco] = useState(false)
  const arriba = foco || value
  return (
    <div>
      <motion.label animate={{ borderColor: error ? '#b42318' : foco ? '#2a8f6a' : '#e4e2dc', boxShadow: foco ? '0 0 0 4px rgba(42,143,106,.12)' : '0 0 0 0 rgba(0,0,0,0)' }}
        className="relative flex h-14 items-center gap-3 rounded-2xl border bg-white px-4">
        <Icon className={`size-5 shrink-0 transition-colors ${foco ? 'text-int-700' : 'text-muted'}`} />
        <div className="relative h-full flex-1">
          <motion.span animate={{ y: arriba ? -11 : 0, scale: arriba ? 0.78 : 1 }} transition={spring}
            className="pointer-events-none absolute top-1/2 left-0 origin-left -translate-y-1/2 text-[15px] text-muted">{label}</motion.span>
          <input ref={inputRef} type={type} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} disabled={disabled}
            onFocus={() => setFoco(true)} onBlur={() => setFoco(false)} onKeyUp={onKeyUp}
            className="absolute inset-0 w-full bg-transparent pt-4 text-[15px] outline-none disabled:opacity-60" />
        </div>
        {derecha}
      </motion.label>
      <AnimatePresence>{error && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-1 pl-1 text-xs text-danger">{error}</motion.p>}</AnimatePresence>
    </div>
  )
}

export default function Login() {
  const { login, confirmarIngreso, entrarModoLocal, mode, portada } = useStore()
  const recordado = (() => { try { return localStorage.getItem('ecotrace-usuario') || '' } catch { return '' } })()
  const [username, setUsername] = useState(recordado)
  const [password, setPassword] = useState('')
  const [recordar, setRecordar] = useState(!!recordado)
  const [ver, setVer] = useState(false)
  const [mayus, setMayus] = useState(false)
  const [estado, setEstado] = useState('idle') // idle | enviando | exito
  const [error, setError] = useState(null) // { msg, campos?, intentos?, hasta? }
  const [ahora, setAhora] = useState(Date.now())
  const [bienvenida, setBienvenida] = useState(null)
  const sacudir = useAnimationControls()
  const passRef = useRef(null)
  const escribiendo = useRef(null)

  const bloqueadoMs = error?.hasta ? error.hasta - ahora : 0
  useEffect(() => {
    if (!error?.hasta) return
    const t = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [error?.hasta])
  useEffect(() => { if (error?.hasta && bloqueadoMs <= 0) setError(null) }, [bloqueadoMs, error?.hasta])

  // Rellena una cuenta demo con efecto de escritura.
  const usarDemo = (c) => {
    clearInterval(escribiendo.current)
    setError(null)
    setUsername(''); setPassword('')
    let i = 0
    const total = c.username.length + c.password.length
    escribiendo.current = setInterval(() => {
      i++
      if (i <= c.username.length) setUsername(c.username.slice(0, i))
      else setPassword(c.password.slice(0, i - c.username.length))
      if (i >= total) { clearInterval(escribiendo.current); passRef.current?.focus() }
    }, 38)
  }
  useEffect(() => () => clearInterval(escribiendo.current), [])

  const enviar = async (e) => {
    e.preventDefault()
    if (estado !== 'idle' || bloqueadoMs > 0) return
    if (!username.trim() || !password) {
      setError({ msg: 'Completa usuario y contraseña', campos: { username: !username.trim() && 'Ingresa tu usuario', password: !password && 'Ingresa tu contraseña' } })
      sacudir.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } })
      return
    }
    setEstado('enviando'); setError(null)
    try {
      const s = await login(username.trim(), password)
      try { recordar ? localStorage.setItem('ecotrace-usuario', username.trim()) : localStorage.removeItem('ecotrace-usuario') } catch { /* sin almacenamiento */ }
      setBienvenida(s)
      setEstado('exito')
      setTimeout(confirmarIngreso, 1500)
    } catch (err) {
      setEstado('idle')
      setPassword('')
      if (err.status === 423) setError({ msg: err.message, hasta: err.data?.hasta })
      else if (err.status === 401) setError({ msg: err.message, intentos: err.data?.intentosRestantes })
      else setError({ msg: err.message })
      sacudir.start({ x: [0, -12, 12, -8, 8, -3, 0], transition: { duration: 0.45 } })
    }
  }

  const sinServidor = mode === 'local'
  const fmtCuenta = (ms) => `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`

  return (
    <div className="grid h-full lg:grid-cols-[1.1fr_1fr]">
      <Escena portada={portada} />
      <div className="relative flex items-center justify-center overflow-y-auto bg-paper px-5 py-10 grain">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.15 }} className="w-full max-w-[400px]">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden"><div className="grid size-10 place-items-center rounded-xl bg-int-700 text-white"><Leaf className="size-5" /></div><p className="text-lg font-semibold">EcoTrace</p></div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-sm font-medium text-int-700">{saludo()} 👋</motion.p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Ingresa a EcoTrace</h1>
          <p className="mt-2 text-sm text-muted">Gestión ambiental de Quito: monitoreo, emisiones, cumplimiento y relaciones.</p>

          {sinServidor ? (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="flex items-center gap-2 font-semibold text-amber-900"><HardDrive className="size-4" />Servidor no disponible</p>
              <p className="mt-1 text-sm text-amber-900/80">No se pudo contactar a la API Spring Boot. Puedes explorar la app con los datos guardados en este navegador.</p>
              <motion.button whileTap={{ scale: 0.97 }} onClick={async () => { await entrarModoLocal(); confirmarIngreso() }} className="mt-4 w-full rounded-xl bg-ink py-3 text-sm font-semibold text-white">Entrar en modo local</motion.button>
            </motion.div>
          ) : (
            <motion.form animate={sacudir} onSubmit={enviar} className="mt-8 space-y-3" noValidate>
              <Campo icon={User} label="Usuario" value={username} onChange={setUsername} autoComplete="username" error={error?.campos?.username} disabled={estado !== 'idle'} />
              <Campo icon={Lock} label="Contraseña" type={ver ? 'text' : 'password'} value={password} onChange={setPassword} autoComplete="current-password" inputRef={passRef}
                error={error?.campos?.password} disabled={estado !== 'idle'} onKeyUp={(e) => setMayus(e.getModifierState?.('CapsLock'))}
                derecha={<button type="button" onClick={() => setVer(!ver)} className="rounded-lg p-1 text-muted hover:text-ink" aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{ver ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}</button>} />
              <AnimatePresence>{mayus && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 pl-1 text-xs text-amber-700"><KeyRound className="size-3.5" />Bloq Mayús está activado</motion.p>}</AnimatePresence>

              <div className="flex items-center justify-between pt-1 text-sm">
                <label className="flex cursor-pointer items-center gap-2 text-muted"><input type="checkbox" checked={recordar} onChange={(e) => setRecordar(e.target.checked)} className="size-4 accent-int-700" />Recordar usuario</label>
              </div>

              <AnimatePresence mode="wait">
                {error && !error.campos && (
                  <motion.div key={error.msg + (error.intentos ?? '')} initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className={`overflow-hidden rounded-xl border px-4 py-3 text-sm ${error.hasta ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-red-200 bg-red-50 text-red-800'}`}>
                    <p className="flex items-center gap-2 font-medium"><ShieldAlert className="size-4 shrink-0" />{error.msg}</p>
                    {error.intentos != null && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="flex gap-1">{Array.from({ length: MAX_INTENTOS }, (_, k) => <motion.span key={k} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: k * 0.04 }} className={`size-2 rounded-full ${k < error.intentos ? 'bg-red-400' : 'bg-red-200'}`} />)}</span>
                        Te queda{error.intentos === 1 ? '' : 'n'} {error.intentos} intento{error.intentos === 1 ? '' : 's'} antes del bloqueo
                      </div>
                    )}
                    {error.hasta && bloqueadoMs > 0 && <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">{fmtCuenta(bloqueadoMs)}</p>}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button type="submit" disabled={bloqueadoMs > 0} whileHover={{ scale: estado === 'idle' ? 1.01 : 1 }} whileTap={{ scale: 0.98 }}
                animate={{ backgroundColor: estado === 'exito' ? '#2a8f6a' : '#1f1f1d' }}
                className="relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl text-[15px] font-semibold text-white shadow-lg shadow-ink/20 disabled:opacity-50">
                <AnimatePresence mode="wait" initial={false}>
                  {estado === 'idle' && <motion.span key="i" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex items-center gap-2">{bloqueadoMs > 0 ? 'Cuenta bloqueada' : 'Ingresar'}<ArrowRight className="size-4" /></motion.span>}
                  {estado === 'enviando' && <motion.span key="e" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}><Loader2 className="size-5 animate-spin" /></motion.span>}
                  {estado === 'exito' && <motion.span key="x" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={spring}><Check className="size-6" /></motion.span>}
                </AnimatePresence>
              </motion.button>
            </motion.form>
          )}

          {!sinServidor && portada?.cuentasDemo?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-8">
              <p className="mb-2 text-xs font-semibold tracking-[.12em] text-muted uppercase">Cuentas de demostración</p>
              <div className="grid gap-2">
                {portada.cuentasDemo.map((c, k) => (
                  <motion.button key={c.username} type="button" onClick={() => usarDemo(c)} disabled={estado !== 'idle'}
                    initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.55 + k * 0.07 } }} whileHover={{ x: 4 }}
                    className="flex items-center gap-3 rounded-xl border border-line bg-white/70 px-3 py-2.5 text-left hover:border-int-300">
                    <span className={`grid size-8 place-items-center rounded-lg text-[11px] font-bold text-white ${{ ADMIN: 'bg-ink', ANALISTA: 'bg-int-700', LECTOR: 'bg-ext-500' }[c.rol]}`}>{c.rol.slice(0, 2)}</span>
                    <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{c.username}</span><span className="block truncate text-xs text-muted">{c.descripcion}</span></span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
          <p className="mt-10 text-center text-[11px] text-muted">Sesión protegida con cookie HttpOnly, CSRF y bloqueo tras {MAX_INTENTOS} intentos.</p>
        </motion.div>
      </div>

      {/* Transición de éxito: un círculo verde cubre la pantalla y da la bienvenida */}
      <AnimatePresence>
        {estado === 'exito' && (
          <motion.div className="fixed inset-0 z-50 grid place-items-center bg-int-700 text-white" initial={{ clipPath: 'circle(0% at 75% 70%)' }} animate={{ clipPath: 'circle(150% at 75% 70%)' }} transition={{ duration: 0.9, ease: [0.65, 0, 0.35, 1], delay: 0.35 }}>
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }} className="text-center">
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-white/15 text-xl font-semibold">{bienvenida?.iniciales}</div>
              <p className="mt-4 text-2xl font-semibold">Bienvenido, {bienvenida?.nombre}</p>
              <p className="mt-1 text-sm text-white/70">{bienvenida?.rolDescripcion}{bienvenida?.ultimoAcceso ? ` · último acceso ${new Date(bienvenida.ultimoAcceso).toLocaleString('es')}` : ''}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
