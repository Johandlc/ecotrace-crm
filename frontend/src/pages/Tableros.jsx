import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Wind, Droplets, ShieldCheck, ClipboardList, ChevronDown, Check, Map as MapIcon, Activity, Plus, Eye, EyeOff, CheckCircle2, Clock, Info } from 'lucide-react'
import { useStore } from '../store'
import { AnimatedNumber, Card, PageHeader, spring } from '../components/ui'
import { FuenteBtn } from '../components/Fuentes'
import { CATEGORIAS, NIVELES, promediosNormativos } from '../lib/alerts'
import { AQ_LEVELS, PARAMS, aqLevel, fmt, fmtTime, ago } from '../lib/params'

const ICONOS = { aire: Wind, agua: Droplets, cumplimiento: ShieldCheck, gestion: ClipboardList }
const FUENTES_ALERTA = { aire: ['remmaq', 'ncaa', 'oms', 'openmeteo'], agua: ['demo'], cumplimiento: ['ncaa'], gestion: ['demo'] }

function Estado({ pendientes }) {
  const peor = pendientes[0]?.level
  const cfg = !peor ? { color: '#2a8f6a', titulo: 'Todo en orden', texto: 'No hay situaciones que requieran acción.' }
    : peor === 'critica' ? { color: NIVELES.critica.color, titulo: 'Situación crítica', texto: 'Hay contaminantes en nivel de alerta oficial. Actúa ahora.' }
      : peor === 'alta' ? { color: NIVELES.alta.color, titulo: 'Requiere acción', texto: 'Hay incumplimientos de norma o permisos vencidos.' }
        : { color: NIVELES.media.color, titulo: 'Atención', texto: 'Nada fuera de la ley, pero hay señales que conviene vigilar.' }
  const cuenta = (l) => pendientes.filter((a) => a.level === l).length
  return (
    <Card className="relative overflow-hidden p-6">
      <motion.div className="absolute -top-24 -right-24 size-72 rounded-full opacity-[.12]" style={{ background: cfg.color }} animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 4 }} />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
        <div className="relative grid size-28 shrink-0 place-items-center">
          <motion.span className="absolute inset-0 rounded-full" style={{ background: cfg.color }} animate={{ scale: [1, 1.25], opacity: [0.35, 0] }} transition={{ repeat: Infinity, duration: 2 }} />
          <div className="relative grid size-24 place-items-center rounded-full text-white shadow-lg" style={{ background: cfg.color }}>
            <div className="text-center"><p className="text-3xl leading-none font-bold"><AnimatedNumber value={pendientes.length} /></p><p className="text-[10px] tracking-wide uppercase opacity-90">pendientes</p></div>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-2xl font-semibold tracking-tight">{cfg.titulo}</p>
          <p className="mt-1 text-muted">{cfg.texto}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(NIVELES).map(([k, n]) => (
              <span key={k} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium ${n.soft}`}>
                <span className="size-2 rounded-full" style={{ background: n.color }} />{n.label}<b className="tabular-nums">{cuenta(k)}</b>
              </span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

function Medidor({ a }) {
  if (a.value == null || a.limit == null) return null
  const tope = Math.max(a.value, a.limit) * 1.25
  const pos = (v) => `${Math.min(100, (v / tope) * 100)}%`
  return (
    <div className="mt-3">
      <div className="relative h-2.5 rounded-full bg-gradient-to-r from-int-100 via-amber-100 to-red-200">
        {a.who != null && <span className="absolute -top-1 h-4.5 w-0.5 rounded bg-int-700" style={{ left: pos(a.who) }} title="Guía OMS" />}
        <span className="absolute -top-1 h-4.5 w-0.5 rounded bg-danger" style={{ left: pos(a.limit) }} title="Límite legal" />
        <motion.span initial={{ left: 0 }} animate={{ left: pos(a.value) }} transition={{ type: 'spring', stiffness: 90, damping: 15 }}
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow" style={{ background: NIVELES[a.level].color }} />
      </div>
      <div className="mt-1.5 flex flex-wrap justify-between gap-2 text-[11px] text-muted">
        <span><b className="text-ink">{fmt(a.value, 1)} {a.unit}</b> · {a.avgLabel}</span>
        <span>{a.who != null && <><span className="text-int-700">▍OMS {fmt(a.who, 0)}</span> · </>}<span className="text-danger">▍Norma {fmt(a.limit, 0)}</span></span>
      </div>
    </div>
  )
}

function Alerta({ a, abierta, onToggle, revisada }) {
  const { toggleRevisada, create } = useStore()
  const Icon = ICONOS[a.kind] || Info
  const n = NIVELES[a.level]
  return (
    <motion.li layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: revisada ? 0.55 : 1, y: 0 }} exit={{ opacity: 0, x: 60, transition: { duration: 0.25 } }} transition={spring}
      className="overflow-hidden rounded-2xl border border-line bg-white">
      <button onClick={onToggle} className="flex w-full items-start gap-3 p-4 text-left">
        <span className="relative mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl text-white" style={{ background: n.color }}>
          <Icon className="size-5" />
          {a.level === 'critica' && !revisada && <motion.span className="absolute inset-0 rounded-xl" style={{ background: n.color }} animate={{ scale: [1, 1.5], opacity: [0.5, 0] }} transition={{ repeat: Infinity, duration: 1.4 }} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${n.soft}`}>{n.label}</span>
            <span className="text-[11px] text-muted">{CATEGORIAS[a.kind]?.label}</span>
            {a.fuente && <span className={`inline-flex items-center gap-1 text-[11px] ${a.stale ? 'text-amber-700' : 'text-muted'}`}><Clock className="size-3" />{a.fuente} · {a.ts > Date.now() ? fmtTime(a.ts) : ago(a.ts)}</span>}
            {revisada && <span className="inline-flex items-center gap-1 text-[11px] text-int-700"><Check className="size-3" />Revisada</span>}
          </span>
          <span className="mt-1 block leading-snug font-semibold">{a.title}</span>
          <Medidor a={a} />
        </span>
        <motion.span animate={{ rotate: abierta ? 180 : 0 }} className="mt-1 text-muted"><ChevronDown className="size-5" /></motion.span>
      </button>
      <AnimatePresence initial={false}>
        {abierta && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }}>
            <div className="grid gap-3 border-t border-line bg-stone-50/60 p-4 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[['Qué está pasando', a.what], ['Por qué importa', a.why], ['Qué hacer', a.action]].map(([t, x], i) => (
                <motion.div key={t} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.05 + i * 0.06 } }} className="rounded-xl bg-white p-3">
                  <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">{t}</p>
                  <p className="mt-1 text-sm">{x}</p>
                </motion.div>
              ))}
              {a.detalle && <p className="text-xs text-muted md:col-span-3 lg:col-span-1 xl:col-span-3">{a.detalle}</p>}
              {a.stale && <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 md:col-span-3 lg:col-span-1 xl:col-span-3">Basado en el último dato publicado ({fmtTime(a.ts)}). La REMMAQ publica sus datos validados con rezago.</p>}
              <div className="flex flex-wrap items-center gap-2 md:col-span-3 lg:col-span-1 xl:col-span-3">
                {a.kind === 'aire' && <a href={`#/mapa?p=${a.pointId}`} className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3 py-1.5 text-sm font-medium text-white"><MapIcon className="size-4" />Ver en el mapa</a>}
                {a.pointId && <a href={`#/monitoreo?p=${a.pointId}`} className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-sm font-medium"><Activity className="size-4" />Ver serie</a>}
                {!a.pointId && <a href={`#/${a.to}`} className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3 py-1.5 text-sm font-medium text-white">Ir a {CATEGORIAS[a.kind]?.label.toLowerCase()}</a>}
                {(a.kind === 'aire' || a.kind === 'agua') && (
                  <button onClick={() => create('findings', { title: a.title, severity: a.level === 'media' ? 'media' : 'alta', status: 'abierto', origin: 'alerta', pointId: a.pointId, param: a.param, due: Date.now() + 7 * 86400000, owner: 'Sin asignar' }, 'Hallazgo creado desde la alerta')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-sm font-medium"><Plus className="size-4" />Crear hallazgo</button>
                )}
                <button onClick={() => toggleRevisada(a.id)} className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium text-int-700 hover:bg-int-50"><Check className="size-4" />{revisada ? 'Marcar pendiente' : 'Marcar revisada'}</button>
                <FuenteBtn ids={FUENTES_ALERTA[a.kind]} className="ml-auto" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  )
}

function EstadoEstaciones() {
  const { data } = useStore()
  const proms = useMemo(() => promediosNormativos(data.readings).filter((x) => x.origen === 'oficial'), [data.readings])
  const est = data.points.filter((p) => p.site?.startsWith('REMMAQ'))
  const pols = ['pm2_5', 'pm10', 'no2', 'o3', 'so2', 'co']
  const ultimo = proms.reduce((m, x) => Math.max(m, x.ts), 0)
  return (
    <Card className="overflow-x-auto p-5 scroll-thin">
      <div className="mb-1 flex items-start justify-between gap-2">
        <div><p className="font-semibold">Estado oficial por estación</p><p className="text-xs text-muted">Promedio del período de la norma · último dato REMMAQ {ultimo ? fmtTime(ultimo) : '—'}</p></div>
        <FuenteBtn ids={['remmaq', 'ncaa', 'oms']} />
      </div>
      <table className="mt-3 w-full min-w-[420px] border-separate border-spacing-1 text-xs">
        <thead><tr><th />{pols.map((k) => <th key={k} className="pb-1 font-medium text-muted">{PARAMS[k].label}</th>)}</tr></thead>
        <tbody>
          {est.map((p, ri) => (
            <tr key={p.id}>
              <td className="pr-2 whitespace-nowrap">{p.name.replace('Estación ', '')}</td>
              {pols.map((k, ci) => {
                const x = proms.find((y) => y.pointId === p.id && y.param === k)
                const lvl = x ? aqLevel(k, x.avg) : null
                return (
                  <td key={k} className="p-0">
                    <motion.a href={x ? `#/mapa?p=${p.id}` : undefined} initial={{ opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: (ri + ci) * 0.015 }}
                      title={x ? `${fmt(x.avg, 1)} ${PARAMS[k].unit} (promedio ${x.horas} h) · ${AQ_LEVELS[lvl].label}` : 'No medido'}
                      className={`grid h-8 place-items-center rounded-md font-semibold ${lvl >= 3 ? 'text-white' : 'text-ink/80'}`} style={{ background: lvl == null ? '#f2f0ea' : AQ_LEVELS[lvl].color + (lvl >= 3 ? '' : '55') }}>
                      {x ? fmt(k === 'co' ? x.avg / 1000 : x.avg, k === 'co' ? 2 : 0) : ''}
                    </motion.a>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">{AQ_LEVELS.map((l) => <span key={l.label} className="flex items-center gap-1 text-[10px] text-muted"><span className="size-2.5 rounded-sm" style={{ background: l.color }} />{l.label} <span className="opacity-70">({l.hint})</span></span>)}</div>
      <p className="mt-2 text-[10px] text-muted">CO en mg/m³; demás en µg/m³.</p>
    </Card>
  )
}

export default function Tableros() {
  const { alerts, revisadas } = useStore()
  const [cat, setCat] = useState('todas')
  const [verRevisadas, setVerRevisadas] = useState(false)
  const [abierta, setAbierta] = useState(null)
  const pendientes = alerts.filter((a) => !revisadas.has(a.id))
  const lista = alerts.filter((a) => (cat === 'todas' || a.kind === cat) && (verRevisadas || !revisadas.has(a.id)))
  return (
    <>
      <PageHeader eyebrow="Salida" title="Tableros y alertas" desc="Qué necesita atención, explicado en simple: qué pasa, por qué importa y qué hacer. Las alertas de aire usan el promedio que exige la norma (24 h, 8 h o 1 h), no una lectura aislada." />
      <Estado pendientes={pendientes} />
      <div className="mt-6 grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {[['todas', 'Todas'], ...Object.entries(CATEGORIAS).map(([k, v]) => [k, v.label])].map(([k, l]) => {
              const n = (k === 'todas' ? pendientes : pendientes.filter((a) => a.kind === k)).length
              return (
                <button key={k} onClick={() => setCat(k)} className={`relative rounded-full px-3 py-1.5 text-sm font-medium transition ${cat === k ? 'text-white' : 'bg-white text-muted hover:text-ink'} border border-line`}>
                  {cat === k && <motion.span layoutId="cat-pill" transition={spring} className="absolute inset-0 rounded-full bg-ink" />}
                  <span className="relative">{l} <span className="opacity-70 tabular-nums">{n}</span></span>
                </button>
              )
            })}
            <button onClick={() => setVerRevisadas(!verRevisadas)} className="ml-auto inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">{verRevisadas ? <EyeOff className="size-4" /> : <Eye className="size-4" />}{verRevisadas ? 'Ocultar revisadas' : `Ver revisadas (${alerts.length - pendientes.length})`}</button>
          </div>
          <motion.ul layout className="space-y-3">
            <AnimatePresence mode="popLayout">
              {lista.map((a) => <Alerta key={a.id} a={a} revisada={revisadas.has(a.id)} abierta={abierta === a.id} onToggle={() => setAbierta(abierta === a.id ? null : a.id)} />)}
            </AnimatePresence>
          </motion.ul>
          {!lista.length && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-muted">
              <CheckCircle2 className="size-8 text-int-500" />Nada pendiente en esta categoría
            </motion.div>
          )}
        </div>
        <div className="grid content-start gap-6 md:grid-cols-2 xl:col-span-5 xl:grid-cols-1">
          <EstadoEstaciones />
          <Card className="p-5 text-sm">
            <p className="font-semibold">¿Cómo leer las alertas?</p>
            <ul className="mt-3 space-y-2.5">
              {Object.entries(NIVELES).map(([k, n]) => (
                <li key={k} className="flex gap-2.5"><span className="mt-1 size-2.5 shrink-0 rounded-full" style={{ background: n.color }} /><span><b>{n.label}:</b> {{ critica: 'umbral oficial de alerta de la NCAA (plan de alerta, alarma y emergencia).', alta: 'supera un límite legal o un permiso venció.', media: 'dentro de la ley pero sobre la guía de salud de la OMS, o una tarea atrasada.', info: 'algo para planificar con tiempo.' }[k]}</span></li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  )
}
