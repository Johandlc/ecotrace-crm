// Buscador del mapa: barrios (OpenStreetMap), parroquias, administraciones zonales y estaciones REMMAQ.
//  · Insensible a tildes y mayúsculas; prioriza coincidencias al inicio del nombre.
//  · Teclado: ↑ ↓ para moverse, Enter para elegir, Esc para cerrar. Atajo "/" para enfocar.
//  · Los ~barrios se cargan bajo demanda (import dinámico) para no pesar en la carga inicial.
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Search, X, MapPin, Landmark, Map as MapIcon, Radio, Loader2 } from 'lucide-react'
import parroquias from '../data/quito-parroquias.json'
import { CENTROIDES, normalizar } from '../lib/geo'
import { spring } from './ui'

const TIPOS = {
  barrio: { label: 'Barrio', icon: MapPin, color: 'bg-ext-50 text-ext-700' },
  sector: { label: 'Sector', icon: MapPin, color: 'bg-ext-50 text-ext-700' },
  poblado: { label: 'Poblado', icon: MapPin, color: 'bg-ext-50 text-ext-700' },
  'caserío': { label: 'Caserío', icon: MapPin, color: 'bg-ext-50 text-ext-700' },
  localidad: { label: 'Localidad', icon: MapPin, color: 'bg-ext-50 text-ext-700' },
  parroquia: { label: 'Parroquia', icon: Landmark, color: 'bg-int-50 text-int-700' },
  zona: { label: 'Zona', icon: MapIcon, color: 'bg-stone-100 text-ink' },
  estacion: { label: 'Estación', icon: Radio, color: 'bg-blue-50 text-blue-800' },
}

/** Resalta la parte del nombre que coincide con la búsqueda. */
function Resaltado({ texto, q }) {
  const i = normalizar(texto).indexOf(normalizar(q))
  if (!q || i < 0) return texto
  return <>{texto.slice(0, i)}<mark className="rounded bg-amber-200/70 px-0.5 text-ink">{texto.slice(i, i + q.length)}</mark>{texto.slice(i + q.length)}</>
}

export default function BuscadorLugares({ zonas, estaciones, onElegir }) {
  const [q, setQ] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [activo, setActivo] = useState(0)
  const [barrios, setBarrios] = useState(null)
  const inputRef = useRef(null)

  // Carga diferida del índice de barrios al primer foco.
  const cargar = () => { if (!barrios) import('../data/quito-barrios.json').then((m) => setBarrios(m.default.barrios)) }

  // Atajo de teclado "/" para enfocar el buscador.
  useEffect(() => {
    const on = (e) => { if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') { e.preventDefault(); inputRef.current?.focus() } }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [])

  const indice = useMemo(() => {
    const nombreZona = Object.fromEntries(zonas.map((z) => [z.id, z.name]))
    const items = [
      ...zonas.map((z) => ({ tipo: 'zona', nombre: z.name, detalle: 'Administración zonal', zonaId: z.id, lat: z.lat, lon: z.lon })),
      ...parroquias.features.map((f) => ({ tipo: 'parroquia', nombre: f.properties.parroquia, detalle: `Parroquia ${f.properties.tipo} · ${f.properties.zona}`, parroquia: f.properties.parroquia, zonaId: f.properties.zonaId, lat: CENTROIDES[f.properties.parroquia][0], lon: CENTROIDES[f.properties.parroquia][1] })),
      ...estaciones.map((s) => ({ tipo: 'estacion', nombre: `Estación ${s.name}`, detalle: 'Red REMMAQ', id: s.id, lat: s.lat, lon: s.lon })),
      ...(barrios || []).map((b) => ({ tipo: b.t, nombre: b.n, detalle: `${b.p} · ${nombreZona[b.z] || ''}`, parroquia: b.p, zonaId: b.z, lat: b.lat, lon: b.lon, osm: b.o })),
    ]
    return items.map((it) => ({ ...it, clave: normalizar(it.nombre) }))
  }, [zonas, estaciones, barrios])

  const resultados = useMemo(() => {
    const n = normalizar(q)
    if (n.length < 2) return []
    const orden = { zona: 0, parroquia: 1, estacion: 2 }
    return indice
      .map((it) => ({ it, pos: it.clave.indexOf(n) }))
      .filter((x) => x.pos >= 0)
      // Primero lo que empieza con el texto, luego zonas/parroquias/estaciones, luego nombres más cortos.
      .sort((a, b) => (a.pos === 0 ? 0 : 1) - (b.pos === 0 ? 0 : 1) || (orden[a.it.tipo] ?? 3) - (orden[b.it.tipo] ?? 3) || a.it.nombre.length - b.it.nombre.length)
      .slice(0, 8)
      .map((x) => x.it)
  }, [indice, q])
  useEffect(() => setActivo(0), [q])

  const elegir = (it) => {
    onElegir(it)
    setQ(it.nombre)
    setAbierto(false)
    inputRef.current?.blur()
  }
  const teclado = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActivo((a) => Math.min(a + 1, resultados.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActivo((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter' && resultados[activo]) { e.preventDefault(); elegir(resultados[activo]) }
    else if (e.key === 'Escape') { setAbierto(false); inputRef.current?.blur() }
  }

  const mostrar = abierto && normalizar(q).length >= 2
  return (
    <div className="relative w-full">
      <motion.div animate={{ boxShadow: abierto ? '0 12px 30px -10px rgba(0,0,0,.35)' : '0 6px 16px -8px rgba(0,0,0,.25)' }}
        className="glass flex items-center gap-2 rounded-2xl border border-white/60 px-3 py-2.5">
        <Search className="size-4 shrink-0 text-muted" />
        <input ref={inputRef} value={q} onChange={(e) => { setQ(e.target.value); setAbierto(true) }} onFocus={() => { cargar(); setAbierto(true) }} onBlur={() => setTimeout(() => setAbierto(false), 150)} onKeyDown={teclado}
          placeholder="Buscar barrio, parroquia o estación…" aria-label="Buscar lugar" role="combobox" aria-expanded={mostrar} aria-controls="resultados-lugares"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted" />
        {abierto && !barrios && <Loader2 className="size-4 animate-spin text-muted" />}
        {q ? <button onMouseDown={(e) => e.preventDefault()} onClick={() => { setQ(''); inputRef.current?.focus() }} className="rounded-full p-0.5 text-muted hover:text-ink" aria-label="Borrar búsqueda"><X className="size-4" /></button>
          : <kbd className="hidden rounded border border-line bg-white px-1.5 text-[10px] text-muted sm:block">/</kbd>}
      </motion.div>
      <AnimatePresence>
        {mostrar && (
          <motion.ul id="resultados-lugares" role="listbox" initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={spring}
            className="absolute inset-x-0 top-full z-10 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-line bg-white p-1.5 shadow-2xl scroll-thin">
            {resultados.length ? resultados.map((it, i) => {
              const T = TIPOS[it.tipo] || TIPOS.barrio
              return (
                <motion.li key={`${it.tipo}-${it.nombre}-${it.detalle}`} role="option" aria-selected={i === activo} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0, transition: { delay: i * 0.02 } }}
                  onMouseDown={(e) => e.preventDefault()} onClick={() => elegir(it)} onMouseEnter={() => setActivo(i)}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 ${i === activo ? 'bg-stone-100' : ''}`}>
                  <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${T.color}`}><T.icon className="size-4" /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium"><Resaltado texto={it.nombre} q={q} /></span><span className="block truncate text-xs text-muted">{it.detalle}</span></span>
                  <span className="shrink-0 text-[10px] font-semibold tracking-wide text-muted uppercase">{T.label}</span>
                </motion.li>
              )
            }) : <li className="px-3 py-4 text-sm text-muted">{barrios ? 'Sin resultados. Prueba con otra parte del nombre.' : 'Cargando barrios…'}</li>}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
