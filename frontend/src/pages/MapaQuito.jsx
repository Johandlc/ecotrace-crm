import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { MapContainer, TileLayer, GeoJSON, Marker, Polyline, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Wind, Factory, Map as MapIcon, Play, Pause, X, Maximize2, Minimize2, Gauge, Radio, Clock, TriangleAlert, ExternalLink, MapPin, Route } from 'lucide-react'
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from 'recharts'
import parroquias from '../data/quito-parroquias.json'
import vias from '../data/quito-vias.json'
import { SECTORES, parroquiaDe } from '../data/quito'
import { useStore } from '../store'
import { AnimatedNumber, Badge, PageHeader, spring } from '../components/ui'
import { FuenteBtn } from '../components/Fuentes'
import EstadisticasQuito from '../components/EstadisticasQuito'
import BuscadorLugares from '../components/BuscadorLugares'
import { AQ_LEVELS, PARAMS, aqLevel, fmt, fmtHour, fmtT } from '../lib/params'
import { CENTROIDES, distanciaKm, idw } from '../lib/geo'

const ZONE_COLORS = { 'Z-CHO': '#8fbf8a', 'Z-DEL': '#9db4d6', 'Z-NOR': '#c9b37a', 'Z-CAL': '#e0a189', 'Z-CEN': '#d69aa8', 'Z-SUR': '#b9a3d6', 'Z-QTB': '#e8c46b', 'Z-TUM': '#8fc1c9', 'Z-CHI': '#a7c58a' }
const POLS = ['pm2_5', 'pm10', 'no2', 'o3', 'so2', 'co']
const unidadRemmaq = (p) => (p === 'co' ? 'mg/m³' : 'µg/m³')
const enEscala = (p, v) => (p === 'co' && v != null ? v * 1000 : v) // la escala de CO está en µg/m³
const nivel = (p, v) => aqLevel(p, enEscala(p, v))
const colorNivel = (i) => (i == null ? '#d6d3cc' : AQ_LEVELS[i].color)

function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    // El panel de detalle ocupa ~400 px a la derecha: se compensa para que el objetivo quede visible.
    const panel = map.getSize().x > 700 ? 400 : 0
    if (!target) map.flyTo([-0.2, -78.47], 11, { duration: 1.6 })
    else if (target.bounds) map.flyToBounds(target.bounds, { paddingTopLeft: [40, 60], paddingBottomRight: [panel + 40, 60], duration: 1.1, maxZoom: 13 })
    else {
      const z = target.zoom ?? Math.max(map.getZoom(), 13)
      map.flyTo(map.unproject(map.project(target.center, z).add([panel / 2, 0]), z), z, { duration: 1 })
    }
  }, [target, map])
  return null
}

function fuenteIcon(f, { dim, sel }) {
  const s = f.co2e ? Math.round(20 + Math.sqrt(f.co2e) / 14) : 22
  const c = SECTORES[f.sector]?.color || '#555'
  const nodata = f.co2e == null
  return L.divIcon({
    className: '', iconSize: [s, s], iconAnchor: [s / 2, s / 2],
    html: `<div class="src-marker ${dim ? 'dim' : ''} ${sel ? 'active' : ''} ${nodata ? 'nodata' : ''}" style="--c:${c}">${nodata ? '' : '<span class="ring"></span><span class="ring r2"></span><span class="plume"><i></i><i></i><i></i></span>'}<span class="core"></span></div>`,
  })
}
function estacionIcon(code, value, pol, sel) {
  const n = nivel(pol, value)
  const s = value == null ? 18 : 30
  return L.divIcon({
    className: '', iconSize: [s, s], iconAnchor: [s / 2, s / 2],
    html: `<div class="st-marker ${n >= 2 ? 'alto' : ''} ${sel ? 'sel' : ''}" style="--c:${colorNivel(n)}"><span class="halo"></span><span class="dot">${value == null ? '' : code}</span></div>`,
  })
}

function Kpi({ icon: Icon, label, value, sub, fuente, contexto, tone }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass pointer-events-auto rounded-2xl border border-white/60 px-3.5 py-2.5 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted"><Icon className="size-3.5" />{label}</p>
        {fuente && <FuenteBtn ids={fuente} contexto={contexto} />}
      </div>
      <p className={`text-xl leading-tight font-semibold ${tone || ''}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted">{sub}</p>}
    </motion.div>
  )
}

export default function MapaQuito({ query }) {
  const { api, mode } = useStore()
  const wrapRef = useRef(null)
  const geoRef = useRef(null)
  const [d, setD] = useState(null)
  const [err, setErr] = useState(null)
  const [capa, setCapa] = useState(query?.get('capa') || 'aire')
  const [pol, setPol] = useState('pm2_5')
  const [t, setT] = useState(null)
  const [play, setPlay] = useState(false)
  const [sel, setSel] = useState(() => (query?.get('p') ? { type: 'station', id: query.get('p') } : null))
  const [sectores, setSectores] = useState(() => new Set(Object.keys(SECTORES)))
  const [hover, setHover] = useState(null)
  const [full, setFull] = useState(false)

  useEffect(() => {
    Promise.all([api.dataset('remmaq'), api.dataset('climatetrace-quito'), api.dataset('inventario-pacq-2015'), api.territory()])
      .then(([remmaq, ct, pacq, terr]) => { setD({ remmaq, ct, pacq, ...terr }); setT(remmaq.hourly.n - 1) })
      .catch((e) => setErr(e.message))
  }, [api, mode])

  // Reproducción del time-lapse
  useEffect(() => {
    if (!play || !d) return
    const id = setInterval(() => setT((x) => (x + 1) % d.remmaq.hourly.n), 260)
    return () => clearInterval(id)
  }, [play, d])

  const estaciones = d?.remmaq.stations || []
  const serie = d?.remmaq.hourly.series[pol] || {}
  const ts = d ? d.remmaq.hourly.start + (t ?? 0) * d.remmaq.hourly.step : null
  const valores = useMemo(() => Object.fromEntries(estaciones.map((s) => [s.id, serie[s.id]?.[t] ?? null])), [estaciones, serie, t])
  const conDato = Object.entries(valores).filter(([, v]) => v != null)
  const promedio = conDato.length ? conDato.reduce((a, [, v]) => a + v, 0) / conDato.length : null
  const maxEst = conDato.sort((a, b) => b[1] - a[1])[0]
  const promedioCiudad = useMemo(() => {
    if (!d) return []
    const n = d.remmaq.hourly.n
    return Array.from({ length: n }, (_, i) => {
      const vs = Object.values(serie).map((a) => a[i]).filter((v) => v != null)
      return vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null
    })
  }, [d, serie])

  const valorParroquia = useCallback((nombre) => (capa === 'aire' ? idw(CENTROIDES[nombre], estaciones, valores) : null), [capa, estaciones, valores])

  const estilo = useCallback((f) => {
    const p = f.properties
    const isSel = sel?.type === 'zone' && sel.id === p.zonaId
    const dim = sel?.type === 'zone' && !isSel
    if (capa === 'aire') {
      const v = valorParroquia(p.parroquia)
      return { color: '#fff', weight: isSel ? 2.5 : 0.7, fillColor: colorNivel(nivel(pol, v)), fillOpacity: v == null ? 0.18 : dim ? 0.25 : 0.55 }
    }
    if (capa === 'emisiones') return { color: '#fff', weight: 0.7, fillColor: ZONE_COLORS[p.zonaId] || '#ccc', fillOpacity: dim ? 0.08 : 0.22 }
    return { color: isSel ? '#1f1f1d' : '#fff', weight: isSel ? 2.5 : 0.9, fillColor: ZONE_COLORS[p.zonaId] || '#ccc', fillOpacity: dim ? 0.2 : 0.55 }
  }, [capa, sel, pol, valorParroquia])

  // Repinta sin recrear la capa: así las transiciones CSS del color quedan suaves durante el time-lapse.
  useEffect(() => { geoRef.current?.eachLayer((l) => l.setStyle(estilo(l.feature))) }, [estilo])

  const onEach = useCallback((feat, lyr) => {
    lyr.on({
      mouseover: (e) => { e.target.setStyle({ weight: 2.5, color: '#1f1f1d' }); e.target.bringToFront(); setHover(feat.properties) },
      mouseout: (e) => { e.target.setStyle(estiloRef.current(feat)); setHover(null) },
      click: () => setSel({ type: 'zone', id: feat.properties.zonaId }),
    })
  }, [])
  const estiloRef = useRef(estilo)
  estiloRef.current = estilo

  const target = useMemo(() => {
    if (!sel || !d) return null
    if (sel.type === 'zone') {
      const feats = parroquias.features.filter((f) => f.properties.zonaId === sel.id)
      return feats.length ? { bounds: L.geoJSON({ type: 'FeatureCollection', features: feats }).getBounds() } : null
    }
    if (sel.type === 'lugar') {
      if (sel.lugar.tipo === 'parroquia') {
        const f = parroquias.features.find((x) => x.properties.parroquia === sel.lugar.parroquia)
        if (f) return { bounds: L.geoJSON(f).getBounds() }
      }
      return { center: [sel.lugar.lat, sel.lugar.lon], zoom: 15 }
    }
    const p = sel.type === 'station' ? estaciones.find((s) => s.id === sel.id) : d.sources.find((s) => s.id === sel.id)
    return p ? { center: [p.lat, p.lon] } : null
  }, [sel, d, estaciones])

  const toggleFull = () => {
    if (!document.fullscreenElement) wrapRef.current?.requestFullscreen?.().then(() => setFull(true)).catch(() => setFull((x) => !x))
    else document.exitFullscreen().then(() => setFull(false))
  }
  useEffect(() => { const on = () => setFull(!!document.fullscreenElement); document.addEventListener('fullscreenchange', on); return () => document.removeEventListener('fullscreenchange', on) }, [])

  if (err) return <p className="text-sm text-danger">No se pudieron cargar los datos del mapa: {err}</p>

  const ctDmq = d?.ct.assets.filter((a) => a.aggregate) || []
  const transporte = ctDmq.find((a) => a.sector === 'road-transportation')
  const puntuales = (d?.sources || []).filter((f) => f.co2e != null).sort((a, b) => b.co2e - a.co2e)
  const hoverVal = hover && capa === 'aire' ? valorParroquia(hover.parroquia) : null

  return (
    <>
      <PageHeader eyebrow="Visión territorial · datos reales" title="Mapa ambiental de Quito"
        desc="Mediciones oficiales de la REMMAQ interpoladas por parroquia, emisiones estimadas por instalación (Climate TRACE 2024) y los corredores viales donde se concentra el tráfico. Toca cualquier zona, estación o fuente." />

      <div ref={wrapRef} className={`relative isolate overflow-hidden rounded-3xl border border-line bg-stone-100 ${full ? 'h-screen rounded-none' : 'h-[calc(100vh-190px)] min-h-[560px]'}`}>
        {d ? (
          <MapContainer center={[-0.2, -78.47]} zoom={10} minZoom={9} maxZoom={17} zoomControl={false} className="h-full w-full">
            <TileLayer className="eco-tiles" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · REMMAQ · Climate TRACE' />
            <GeoJSON ref={geoRef} data={parroquias} style={estilo} onEachFeature={onEach} />
            {capa === 'emisiones' && sectores.has('transporte') && vias.features.map((v) => (
              <Polyline key={v.properties.osmId} positions={v.geometry.coordinates.map(([lon, lat]) => [lat, lon])} pathOptions={{ color: '#c4643f', weight: v.properties.highway === 'motorway' ? 3.5 : 2.5, opacity: 0.85, className: 'via-flow' }} />
            ))}
            {capa === 'zonas' && d.zones.map((z) => (
              <Marker key={z.id} position={[z.lat, z.lon]} icon={L.divIcon({ className: '', iconSize: [0, 0] })}>
                <Tooltip permanent direction="center" className="zona-label">{z.name}</Tooltip>
              </Marker>
            ))}
            {capa !== 'emisiones' && estaciones.map((s) => (
              <Marker key={`${s.id}-${valores[s.id] != null}-${nivel(pol, valores[s.id])}-${sel?.id === s.id}`} position={[s.lat, s.lon]} icon={estacionIcon(s.code, valores[s.id], pol, sel?.id === s.id)}
                eventHandlers={{ click: () => setSel({ type: 'station', id: s.id }) }}>
                <Tooltip direction="top" offset={[0, -12]} className="eco-tip"><b>{s.name}</b> · REMMAQ<br />{PARAMS[pol].label}: {valores[s.id] == null ? 'sin dato en esta hora' : `${fmt(valores[s.id], 2)} ${unidadRemmaq(pol)}`}</Tooltip>
              </Marker>
            ))}
            {capa === 'emisiones' && d.sources.map((f) => (
              <Marker key={`${f.id}-${sectores.has(f.sector)}-${sel?.id === f.id}`} position={[f.lat, f.lon]} icon={fuenteIcon(f, { dim: !sectores.has(f.sector), sel: sel?.id === f.id })}
                eventHandlers={{ click: () => setSel({ type: 'source', id: f.id }) }}>
                <Tooltip direction="top" offset={[0, -12]} className="eco-tip"><b>{f.name}</b><br />{f.co2e != null ? `${fmtT(f.co2e)} CO₂e/año (${f.year})` : 'Sin dato público de emisiones'}</Tooltip>
              </Marker>
            ))}
            {sel?.type === 'lugar' && (
              <Marker key={`lugar-${sel.lugar.nombre}`} position={[sel.lugar.lat, sel.lugar.lon]} zIndexOffset={1000}
                icon={L.divIcon({ className: '', iconSize: [34, 44], iconAnchor: [17, 42], html: '<div class="pin-lugar"><span class="pin-onda"></span><span class="pin-cabeza"></span></div>' })} />
            )}
            <FlyTo target={target} />
          </MapContainer>
        ) : (
          <div className="grid h-full place-items-center">
            <div className="flex flex-col items-center gap-3 text-sm text-muted">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }} className="size-9 rounded-full border-4 border-int-100 border-t-int-700" />
              Cargando datos oficiales de la REMMAQ y Climate TRACE…
            </div>
          </div>
        )}

        {d && (
          <>
            {/* Controles de capa + buscador de barrios */}
            <div className="absolute top-3 left-3 z-[550] flex w-[min(380px,calc(100%-24px))] flex-col gap-2">
            <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.3 } }} className="glass self-start max-w-full rounded-2xl border border-white/60 p-1.5 shadow-lg">
              <div className="flex gap-1">
                {[['aire', 'Aire', Wind], ['emisiones', 'Emisiones', Factory], ['zonas', 'Zonas', MapIcon]].map(([k, l, I]) => (
                  <button key={k} onClick={() => { setCapa(k); setSel(null) }} className={`relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium ${capa === k ? 'text-white' : 'text-muted hover:text-ink'}`}>
                    {capa === k && <motion.span layoutId="capa-pill" transition={spring} className="absolute inset-0 rounded-xl bg-ink" />}
                    <I className="relative size-4" /><span className="relative">{l}</span>
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                {capa === 'aire' && (
                  <motion.div key="pols" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex flex-wrap gap-1 overflow-hidden px-0.5 pt-1.5">
                    {POLS.map((p) => (
                      <button key={p} onClick={() => setPol(p)} className={`rounded-lg px-2 py-0.5 text-xs font-semibold transition ${pol === p ? 'bg-int-700 text-white' : 'bg-white text-muted hover:text-ink'}`}>{PARAMS[p].label}</button>
                    ))}
                  </motion.div>
                )}
                {capa === 'emisiones' && (
                  <motion.div key="secs" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex max-w-[360px] flex-wrap gap-1 overflow-hidden px-0.5 pt-1.5">
                    {[...new Set(d.sources.map((f) => f.sector))].map((k) => (
                      <button key={k} onClick={() => setSectores((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n })}
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold transition ${sectores.has(k) ? 'text-white' : 'bg-white text-muted'}`} style={sectores.has(k) ? { background: SECTORES[k].color } : undefined}>{SECTORES[k].label}</button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.45 } }}>
              <BuscadorLugares zonas={d.zones} estaciones={estaciones} onElegir={(it) => {
                if (it.tipo === 'zona') setSel({ type: 'zone', id: it.zonaId })
                else if (it.tipo === 'estacion') { setCapa('aire'); setSel({ type: 'station', id: it.id }) }
                else setSel({ type: 'lugar', id: `${it.tipo}-${it.nombre}`, lugar: it })
              }} />
            </motion.div>
            </div>

            {/* KPIs */}
            <div className="pointer-events-none absolute top-3 right-3 z-[500] hidden w-60 flex-col gap-2 md:flex">
              <AnimatePresence mode="popLayout">
                {capa === 'aire' && [
                  <Kpi key="a1" icon={Gauge} label={`Promedio de la red · ${PARAMS[pol].label}`} value={<><AnimatedNumber value={promedio ?? 0} decimals={1} /> <span className="text-xs font-normal text-muted">{unidadRemmaq(pol)}</span></>} sub={`${conDato.length} de 9 estaciones con dato`} tone={promedio != null ? '' : 'text-muted'} fuente={['remmaq']} contexto="Promedio simple de las estaciones REMMAQ con dato en la hora mostrada." />,
                  <Kpi key="a2" icon={TriangleAlert} label="Estación más alta" value={maxEst ? estaciones.find((s) => s.id === maxEst[0])?.name : '—'} sub={maxEst ? `${fmt(maxEst[1], 1)} ${unidadRemmaq(pol)} · ${AQ_LEVELS[nivel(pol, maxEst[1])]?.label}` : null} fuente={['remmaq', 'ncaa', 'oms']} />,
                  <Kpi key="a3" icon={Clock} label="Último dato oficial publicado" value={new Date(d.remmaq.meta.lastTs).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })} sub="La REMMAQ publica datos validados con rezago" fuente={['remmaq']} />,
                ]}
                {capa === 'emisiones' && [
                  <Kpi key="e1" icon={Factory} label="Inventario GEI del DMQ (2015)" value={fmtT(d.pacq.total) + ' CO₂e'} sub="Transporte 40 % · energía 26 %" fuente={['pacq']} />,
                  <Kpi key="e2" icon={Route} label="Transporte por carretera (2024)" value={transporte ? fmtT(transporte.emissions.co2e_100yr) + ' CO₂e' : '—'} sub="Estimación para todo el DMQ" fuente={['climatetrace', 'usfq2012']} contexto="Climate TRACE no asigna el tráfico a vías concretas: las líneas animadas son los corredores principales (OSM), no emisiones por tramo." />,
                  <Kpi key="e3" icon={MapPin} label="Mayor fuente puntual" value={puntuales[0]?.name.replace(' Internacional', '')} sub={puntuales[0] ? `${fmtT(puntuales[0].co2e)} CO₂e/año` : ''} fuente={['climatetrace', 'osm']} />,
                ]}
                {capa === 'zonas' && [
                  <Kpi key="z1" icon={MapIcon} label="Administraciones zonales" value="9 zonas · 65 parroquias" sub="32 urbanas y 33 rurales" fuente={['zonas', 'osm']} />,
                ]}
              </AnimatePresence>
            </div>

            {/* Tarjeta de hover */}
            <AnimatePresence>
              {hover && !sel && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass pointer-events-none absolute top-3 left-1/2 z-[500] hidden -translate-x-1/2 rounded-xl border border-white/60 px-3 py-2 text-sm shadow-lg xl:block">
                  <p className="font-semibold">{hover.parroquia}</p>
                  <p className="text-xs text-muted">{hover.zona} · parroquia {hover.tipo}</p>
                  {capa === 'aire' && <p className="mt-1 text-xs">{hoverVal == null ? 'Fuera de la cobertura de la red' : <>≈ <b>{fmt(hoverVal, 1)}</b> {unidadRemmaq(pol)} {PARAMS[pol].label} <span className="text-muted">(interpolado)</span></>}</p>}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botones mapa */}
            <div className="absolute right-3 bottom-[118px] z-[500] flex flex-col gap-1.5 md:bottom-3">
              <button onClick={toggleFull} className="glass rounded-xl border border-white/60 p-2 shadow-lg hover:bg-white" aria-label="Pantalla completa">{full ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}</button>
            </div>

            {/* Reproductor del time-lapse */}
            {capa === 'aire' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }} className="glass absolute bottom-3 left-3 z-[500] w-[min(560px,calc(100%-24px))] rounded-2xl border border-white/60 p-3 shadow-lg md:right-auto">
                <div className="flex items-center gap-3">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPlay(!play)} className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-white shadow" aria-label={play ? 'Pausar' : 'Reproducir'}>
                    {play ? <Pause className="size-4" /> : <Play className="ml-0.5 size-4" />}
                  </motion.button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-semibold capitalize">{fmtHour(ts)}</p>
                      <span className="flex items-center gap-1 text-[11px] text-muted">{Math.round(d.remmaq.hourly.n / 24)} días · REMMAQ <FuenteBtn ids={['remmaq']} /></span>
                    </div>
                    <div className="relative mt-1 h-8">
                      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox={`0 0 ${promedioCiudad.length} 100`}>
                        {(() => {
                          const max = Math.max(1, ...promedioCiudad.filter((v) => v != null))
                          const pts = promedioCiudad.map((v, i) => (v == null ? null : `${i},${100 - (v / max) * 90}`)).filter(Boolean)
                          return <><polyline points={pts.join(' ')} fill="none" stroke="#1f1f1d" strokeOpacity=".35" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                            <rect x={0} y={0} width={t ?? 0} height={100} fill="#2a8f6a" fillOpacity=".12" /></>
                        })()}
                      </svg>
                      <input type="range" className="scrub absolute inset-x-0 bottom-0 w-full" min={0} max={d.remmaq.hourly.n - 1} value={t ?? 0} onChange={(e) => { setPlay(false); setT(+e.target.value) }} aria-label="Hora" />
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  {AQ_LEVELS.map((l) => <span key={l.label} className="flex items-center gap-1 text-[10px] text-muted" title={l.hint}><span className="size-2.5 rounded-sm" style={{ background: l.color }} />{l.label}</span>)}
                  <span className="flex items-center gap-1 text-[10px] text-muted"><span className="size-2.5 rounded-sm bg-stone-300" />Sin cobertura</span>
                </div>
              </motion.div>
            )}
            {capa === 'emisiones' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass absolute bottom-3 left-3 z-[500] max-w-[calc(100%-24px)] rounded-2xl border border-white/60 px-3 py-2 text-[11px] text-muted shadow-lg">
                <p className="flex items-center gap-2"><span className="inline-block h-0.5 w-6 bg-ext-500" />Corredores viales principales (OSM)</p>
                <p className="mt-1 flex items-center gap-2"><span className="inline-block size-3 rounded-full bg-ext-500 ring-2 ring-white" />Tamaño ∝ CO₂e anual (Climate TRACE 2024)</p>
                <p className="mt-1 flex items-center gap-2"><span className="inline-block size-3 rounded-full border-2 border-dashed border-stone-500 bg-white" />Ubicación real sin dato público de emisiones</p>
              </motion.div>
            )}

            {/* Panel de detalle */}
            <AnimatePresence>
              {sel && <Detalle key={`${sel.type}-${sel.id}`} sel={sel} d={d} pol={pol} t={t} valores={valores} onClose={() => setSel(null)} onSel={setSel} />}
            </AnimatePresence>
          </>
        )}
      </div>

      {d && <EstadisticasQuito d={d} />}
    </>
  )
}

function Fila({ label, value, unit, color }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-line/70 py-1.5 text-sm last:border-0">
      <span className="flex items-center gap-2 text-muted">{color && <span className="size-2.5 rounded-sm" style={{ background: color }} />}{label}</span>
      <span className="font-semibold tabular-nums">{value}{unit && <span className="ml-1 text-xs font-normal text-muted">{unit}</span>}</span>
    </div>
  )
}

function Detalle({ sel, d, pol, t, valores, onClose, onSel }) {
  const { remmaq } = d
  let body = null
  if (sel.type === 'lugar') {
    const L0 = sel.lugar
    const zona = d.zones.find((z) => z.id === L0.zonaId)
    const ts = remmaq.hourly.start + t * remmaq.hourly.step
    // Valor interpolado de cada contaminante en el punto del barrio, para la hora del time-lapse.
    const aire = POLS.map((k) => {
      const vals = Object.fromEntries(remmaq.stations.map((s) => [s.id, remmaq.hourly.series[k]?.[s.id]?.[t] ?? null]))
      return { k, v: idw([L0.lat, L0.lon], remmaq.stations, vals) }
    })
    const principal = aire.find((x) => x.k === pol)
    const nivelP = nivel(pol, principal?.v)
    const cercanas = remmaq.stations.map((s) => ({ ...s, km: distanciaKm(L0.lat, L0.lon, s.lat, s.lon) })).sort((x, y) => x.km - y.km).slice(0, 2)
    const fuentes = d.sources.map((f) => ({ ...f, km: distanciaKm(L0.lat, L0.lon, f.lat, f.lon) })).filter((f) => f.km <= 15).sort((x, y) => x.km - y.km).slice(0, 4)
    body = (
      <>
        <Badge tone="ext"><MapPin className="size-3" />{L0.tipo === 'parroquia' ? 'Parroquia' : L0.tipo.charAt(0).toUpperCase() + L0.tipo.slice(1)}</Badge>
        <h3 className="mt-2 text-xl leading-snug font-semibold">{L0.nombre}</h3>
        <p className="text-xs text-muted">{L0.tipo !== 'parroquia' && `${L0.parroquia} · `}{zona?.name}</p>

        <div className="mt-4 overflow-hidden rounded-2xl text-white" style={{ background: colorNivel(nivelP) }}>
          <div className="p-4">
            <p className="text-[11px] font-medium tracking-wide uppercase opacity-80">{PARAMS[pol].label} estimado aquí</p>
            <p className="mt-1 text-3xl font-semibold">{principal?.v == null ? 'Sin cobertura' : <><AnimatedNumber value={principal.v} decimals={1} /> <span className="text-sm font-normal opacity-80">{unidadRemmaq(pol)}</span></>}</p>
            <p className="text-sm opacity-90">{nivelP == null ? 'Ninguna estación a menos de 13 km' : `${AQ_LEVELS[nivelP].label} · ${AQ_LEVELS[nivelP].hint}`}</p>
          </div>
          <p className="bg-black/15 px-4 py-1.5 text-[11px]"><span className="capitalize">{fmtHour(ts)}</span> · interpolado desde la REMMAQ</p>
        </div>

        <div className="mt-4 flex items-center justify-between"><p className="text-xs font-semibold tracking-wide text-muted uppercase">Otros contaminantes</p><FuenteBtn ids={['remmaq', 'oms', 'ncaa']} contexto="Interpolación por distancia inversa (IDW) desde las estaciones con dato en esa hora; no es una medición en el barrio." /></div>
        {aire.filter((x) => x.k !== pol).map((x) => <Fila key={x.k} label={PARAMS[x.k].label} value={x.v == null ? 's/d' : fmt(x.v, 2)} unit={x.v == null ? null : unidadRemmaq(x.k)} color={colorNivel(nivel(x.k, x.v))} />)}

        <p className="mt-4 mb-1 text-xs font-semibold tracking-wide text-muted uppercase">Estaciones más cercanas</p>
        {cercanas.map((s) => (
          <button key={s.id} onClick={() => onSel({ type: 'station', id: s.id })} className="flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-sm hover:bg-white">
            <span className="flex items-center gap-2"><Radio className="size-3.5 text-muted" />{s.name}</span><span className="text-muted tabular-nums">{fmt(s.km, 1)} km</span>
          </button>
        ))}

        <div className="mt-4 mb-1 flex items-center justify-between"><p className="text-xs font-semibold tracking-wide text-muted uppercase">Fuentes de emisión a menos de 15 km</p><FuenteBtn ids={['climatetrace', 'osm']} /></div>
        {fuentes.length ? fuentes.map((f) => (
          <button key={f.id} onClick={() => onSel({ type: 'source', id: f.id })} className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-sm hover:bg-white">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: SECTORES[f.sector]?.color }} />
            <span className="min-w-0 flex-1 truncate">{f.name}</span>
            <span className="shrink-0 text-xs text-muted tabular-nums">{fmt(f.km, 1)} km{f.co2e != null ? ` · ${fmtT(f.co2e)}` : ''}</span>
          </button>
        )) : <p className="text-sm text-muted">Ninguna fuente registrada cerca.</p>}

        {zona && <button onClick={() => onSel({ type: 'zone', id: zona.id })} className="mt-4 w-full rounded-xl border border-line bg-white py-2 text-sm font-medium hover:bg-stone-50">Ver la zona {zona.name}</button>}
        {L0.osm && <a href={`https://www.openstreetmap.org/${{ n: 'node', w: 'way', r: 'relation' }[L0.osm[0]]}/${L0.osm.slice(1)}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-int-700 hover:underline">Ver en OpenStreetMap<ExternalLink className="size-3" /></a>}
      </>
    )
  } else if (sel.type === 'station') {
    const s = remmaq.stations.find((x) => x.id === sel.id)
    const serie = remmaq.hourly.series[pol]?.[sel.id] || []
    const chart = serie.map((v, i) => ({ ts: remmaq.hourly.start + i * remmaq.hourly.step, v }))
    const daily = remmaq.daily[pol]?.[sel.id] || []
    const p = PARAMS[pol]
    const lim24 = pol === 'co' ? null : p.who
    const diasOms = pol === 'pm2_5' || pol === 'pm10' || pol === 'so2' ? daily.filter((x) => x[1] > p.who).length : null
    const anual = remmaq.annual[pol]?.[sel.id] || {}
    const ultimoAnio = Object.keys(anual).filter((y) => anual[y].days >= 270).sort().at(-1)
    body = (
      <>
        <Badge tone="ext">Estación REMMAQ · {s.code}</Badge>
        <h3 className="mt-2 text-xl font-semibold">{s.name}</h3>
        <p className="text-xs text-muted">{s.lat.toFixed(4)}, {s.lon.toFixed(4)}{s.approx ? ' · ubicación aproximada' : ''}</p>
        <p className="mt-4 mb-1 text-xs font-semibold tracking-wide text-muted uppercase">En la hora seleccionada</p>
        {POLS.map((k) => {
          const v = remmaq.hourly.series[k]?.[sel.id]?.[t]
          return <Fila key={k} label={PARAMS[k].label} value={v == null ? 'sin dato' : fmt(v, 2)} unit={v == null ? null : unidadRemmaq(k)} color={colorNivel(nivel(k, v))} />
        })}
        <div className="mt-4 flex items-center justify-between"><p className="text-xs font-semibold tracking-wide text-muted uppercase">{p.label} · {Math.round(remmaq.hourly.n / 24)} días</p><FuenteBtn ids={['remmaq', 'oms']} /></div>
        <div className="mt-1 h-36">
          <ResponsiveContainer>
            <AreaChart data={chart} margin={{ left: -24, right: 4, top: 6 }}>
              <defs><linearGradient id="gst" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c4643f" stopOpacity={0.35} /><stop offset="1" stopColor="#c4643f" stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="ts" hide /><YAxis tick={{ fontSize: 10, fill: '#6b6a66' }} axisLine={false} tickLine={false} />
              <RTooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} labelFormatter={(x) => fmtHour(x)} formatter={(v) => [`${fmt(v, 2)} ${unidadRemmaq(pol)}`, p.label]} />
              {lim24 && <ReferenceLine y={lim24} stroke="#2a8f6a" strokeDasharray="4 3" label={{ value: 'OMS', fontSize: 9, fill: '#2a8f6a', position: 'insideTopRight' }} />}
              <ReferenceLine x={chart[t]?.ts} stroke="#1f1f1d" />
              <Area type="monotone" dataKey="v" stroke="#c4643f" strokeWidth={1.6} fill="url(#gst)" connectNulls isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {ultimoAnio && <div className="rounded-xl bg-stone-50 p-3"><p className="text-lg font-semibold"><AnimatedNumber value={anual[ultimoAnio].mean} decimals={1} /></p><p className="text-[11px] text-muted">Promedio {ultimoAnio} ({unidadRemmaq(pol)})</p></div>}
          {diasOms != null && <div className="rounded-xl bg-stone-50 p-3"><p className="text-lg font-semibold"><AnimatedNumber value={diasOms} /></p><p className="text-[11px] text-muted">días sobre guía OMS 24 h (último año)</p></div>}
        </div>
      </>
    )
  } else if (sel.type === 'zone') {
    const z = d.zones.find((x) => x.id === sel.id)
    const parrs = parroquias.features.filter((f) => f.properties.zonaId === sel.id).map((f) => f.properties.parroquia)
    const ests = remmaq.stations.filter((s) => parroquias.features.some((f) => f.properties.zonaId === sel.id && f.properties.parroquia === parroquiaDeEstacion(s)))
    const fuentes = d.sources.filter((f) => f.zoneId === sel.id).sort((a, b) => (b.co2e ?? -1) - (a.co2e ?? -1))
    const maxF = Math.max(1, ...fuentes.map((f) => f.co2e ?? 0))
    body = (
      <>
        <Badge>Administración zonal</Badge>
        <h3 className="mt-2 text-xl font-semibold">{z?.name}</h3>
        <p className="mt-1 text-sm text-muted">{z?.description}</p>
        <p className="mt-3 text-xs text-muted"><b className="text-ink">{parrs.length} parroquias:</b> {parrs.join(', ')}</p>
        <div className="mt-4 flex items-center justify-between"><p className="text-xs font-semibold tracking-wide text-muted uppercase">Estaciones REMMAQ</p><FuenteBtn ids={['remmaq', 'coordenadas']} /></div>
        {ests.length ? ests.map((s) => (
          <button key={s.id} onClick={() => onSel({ type: 'station', id: s.id })} className="block w-full text-left"><Fila label={s.name} value={valores[s.id] == null ? 'sin dato' : fmt(valores[s.id], 1)} unit={valores[s.id] == null ? null : `${unidadRemmaq(pol)} ${PARAMS[pol].label}`} color={colorNivel(nivel(pol, valores[s.id]))} /></button>
        )) : <p className="text-sm text-muted">Sin estaciones en esta zona: los valores del mapa se interpolan desde las más cercanas, si están a menos de 13 km.</p>}
        <div className="mt-4 flex items-center justify-between"><p className="text-xs font-semibold tracking-wide text-muted uppercase">Fuentes de emisión</p><FuenteBtn ids={['climatetrace', 'osm']} /></div>
        {fuentes.length ? fuentes.map((f, i) => (
          <button key={f.id} onClick={() => onSel({ type: 'source', id: f.id })} className="mb-2 block w-full text-left">
            <div className="flex justify-between text-sm"><span className="truncate">{f.name}</span><span className="ml-2 shrink-0 text-muted tabular-nums">{f.co2e != null ? fmtT(f.co2e) : 's/d'}</span></div>
            <div className="mt-1 h-1.5 rounded-full bg-stone-100"><motion.div initial={{ width: 0 }} animate={{ width: `${((f.co2e ?? 0) / maxF) * 100}%` }} transition={{ delay: i * 0.06, duration: 0.7 }} className="h-full rounded-full" style={{ background: SECTORES[f.sector]?.color }} /></div>
          </button>
        )) : <p className="text-sm text-muted">No hay fuentes puntuales registradas.</p>}
      </>
    )
  } else {
    const f = d.sources.find((x) => x.id === sel.id)
    const rows = [['CO₂e (100 años)', f.co2e], ['CO₂', f.co2], ['CH₄', f.ch4], ['PM2.5', f.pm25], ['NOx', f.nox], ['SO₂', f.so2], ['CO', f.co]]
    body = (
      <>
        <Badge><span className="size-2 rounded-full" style={{ background: SECTORES[f.sector]?.color }} />{SECTORES[f.sector]?.label}</Badge>
        <h3 className="mt-2 text-xl leading-snug font-semibold">{f.name}</h3>
        <p className="text-xs text-muted">{f.parroquia}{f.zoneId ? ` · ${d.zones.find((z) => z.id === f.zoneId)?.name}` : ''}</p>
        {f.description && <p className="mt-2 text-sm text-muted">{f.description}</p>}
        {f.co2e != null ? (
          <>
            <div className="mt-4 flex items-center justify-between"><p className="text-xs font-semibold tracking-wide text-muted uppercase">Emisiones estimadas {f.year} (t/año)</p><FuenteBtn ids={['climatetrace']} /></div>
            {rows.filter(([, v]) => v != null && v > 0).map(([l, v]) => <Fila key={l} label={l} value={fmt(v, v < 100 ? 1 : 0)} unit="t" />)}
            <p className="mt-3 rounded-xl bg-stone-50 px-3 py-2 text-[11px] text-muted">Estimación independiente de Climate TRACE (satélites y modelos), no medición en chimenea.</p>
          </>
        ) : (
          <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">Ubicación verificada en OpenStreetMap. No existe un dato público de emisiones para esta instalación: no se muestra ninguna cifra.</p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span>Coordenadas: {f.coordSource}</span>
          {f.reference?.split(' ').map((u) => <a key={u} href={u} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-int-700 hover:underline">registro<ExternalLink className="size-3" /></a>)}
        </div>
      </>
    )
  }
  return (
    <motion.aside initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={spring}
      className="glass absolute top-3 right-3 bottom-3 z-[600] flex w-[min(380px,calc(100%-24px))] flex-col rounded-2xl border border-white/60 shadow-2xl">
      <button onClick={onClose} className="absolute top-3 right-3 z-10 rounded-full bg-white/80 p-1.5 text-muted shadow hover:text-ink" aria-label="Cerrar"><X className="size-4" /></button>
      <div className="flex-1 overflow-y-auto p-5 scroll-thin">{body}</div>
    </motion.aside>
  )
}

// Estación → parroquia (por punto en polígono) para agrupar por zona.
const cacheParr = new Map()
function parroquiaDeEstacion(s) {
  if (!cacheParr.has(s.id)) cacheParr.set(s.id, parroquiaDe(s.lon, s.lat, parroquias)?.parroquia ?? null)
  return cacheParr.get(s.id)
}
