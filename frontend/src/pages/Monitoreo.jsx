import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Wind, Droplets, Volume2, MapPin } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore } from '../store'
import { AnimatedNumber, Badge, Card, PageHeader, Tabs, spring } from '../components/ui'
import { MEDIA, PARAMS, ago, fmt, ratio } from '../lib/params'
import { latestByPointParam } from '../lib/alerts'

const ICON = { aire: Wind, agua: Droplets, ruido: Volume2 }

function Gauge({ param, reading }) {
  const p = PARAMS[param]
  const v = reading?.value
  const r = v == null ? 0 : Math.min(1.4, ratio(param, v))
  const bad = reading?.exceed
  return (
    <Card tone={bad ? 'danger' : 'neutral'} className="p-4">
      <div className="flex items-center justify-between"><p className="text-sm font-medium">{p.label}</p>{bad ? <Badge tone="danger" dot>Excede</Badge> : <Badge tone="ok">OK</Badge>}</div>
      <p className="mt-2 text-2xl font-semibold"><AnimatedNumber value={v ?? 0} decimals={param === 'ph' ? 2 : 1} /><span className="ml-1 text-sm font-normal text-muted">{p.unit}</span></p>
      <div className="relative mt-3 h-2 rounded-full bg-gradient-to-r from-int-100 via-amber-100 to-red-200">
        <span className="absolute top-[-3px] h-3.5 w-px bg-ink/50" style={{ left: `${(1 / 1.4) * 100}%` }} />
        <motion.span initial={{ left: 0 }} animate={{ left: `${(r / 1.4) * 100}%` }} transition={{ type: 'spring', stiffness: 120, damping: 16 }} className={`absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ${bad ? 'bg-danger' : 'bg-int-700'}`} />
      </div>
      <p className="mt-2 text-[11px] text-muted">Límite {p.min != null ? `${p.min}–${p.max}` : `≤ ${p.max}`} · {p.norm}{reading && ` · ${ago(reading.ts)}`}</p>
    </Card>
  )
}

export default function Monitoreo({ query }) {
  const { data } = useStore()
  const [medium, setMedium] = useState(() => data.points.find((p) => p.id === query?.get('p'))?.type || 'aire')
  const pts = data.points.filter((p) => p.type === medium)
  const [sel, setSel] = useState(query?.get('p') || pts[0]?.id)
  const point = pts.find((p) => p.id === sel) || pts[0]
  const [param, setParam] = useState(MEDIA[medium].params[0])
  const prm = MEDIA[medium].params.includes(param) ? param : MEDIA[medium].params[0]
  const latest = useMemo(() => latestByPointParam(data.readings), [data.readings])
  const ORIGEN = (r) => (r.channel === 'remmaq' ? 'oficial' : r.channel === 'api' ? 'modelo' : 'interna')
  const disponibles = useMemo(() => {
    const s = new Set()
    data.readings.forEach((r) => { if (r.pointId === point?.id && r.param === prm) s.add(ORIGEN(r)) })
    return ['oficial', 'modelo', 'interna'].filter((o) => s.has(o))
  }, [data.readings, point, prm])
  const [origenSel, setOrigen] = useState(null)
  const origen = disponibles.includes(origenSel) ? origenSel : disponibles[0]
  // Últimos 7 días CON DATOS del origen elegido (los datos oficiales se publican con rezago).
  const series = useMemo(() => {
    if (!point || !origen) return []
    const rs = data.readings.filter((r) => r.pointId === point.id && r.param === prm && ORIGEN(r) === origen)
    const last = rs.reduce((m, r) => Math.max(m, r.ts), 0)
    return rs.filter((r) => r.ts > last - 7 * 86400000).map((r) => ({ ts: Math.round(r.ts / 3600000) * 3600000, [origen === 'interna' ? 'interna' : 'externa']: r.value })).sort((a, b) => a.ts - b.ts)
  }, [data.readings, point, prm, origen])
  const p = PARAMS[prm]

  return (
    <>
      <PageHeader eyebrow="Módulo" tone="int" title="Monitoreo ambiental" desc="Agua, aire y ruido por punto de monitoreo, con datos propios (sensores, formularios) y externos (API, laboratorio) contra su límite." />
      <div className="mb-5"><Tabs id="medium" value={medium} onChange={(m) => { setMedium(m); setSel(data.points.find((x) => x.type === m)?.id) }} tabs={Object.entries(MEDIA).map(([k, v]) => ({ value: k, label: v.label, count: data.points.filter((x) => x.type === k).length }))} /></div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-3">
          {pts.map((pt) => {
            const Icon = ICON[pt.type]
            const bad = MEDIA[pt.type].params.some((k) => latest.get(`${pt.id}|${k}`)?.exceed)
            const active = pt.id === point?.id
            return (
              <motion.button key={pt.id} layout onClick={() => setSel(pt.id)} whileHover={{ x: 3 }} transition={spring} className={`relative flex w-full items-center gap-3 rounded-2xl border p-3 text-left ${active ? 'border-ink bg-white shadow-sm' : 'border-line bg-white/60'}`}>
                <div className={`grid size-9 place-items-center rounded-xl ${bad ? 'bg-red-50 text-danger' : 'bg-int-50 text-int-700'}`}><Icon className="size-4" /></div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{pt.name}</p><p className="flex items-center gap-1 text-xs text-muted"><MapPin className="size-3" />{pt.site}</p></div>
                {bad && <span className="relative flex size-2.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-danger opacity-60" /><span className="relative size-2.5 rounded-full bg-danger" /></span>}
              </motion.button>
            )
          })}
        </div>
        <div className="space-y-6 lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div key={point?.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-4">
              {MEDIA[medium].params.map((k) => <button key={k} onClick={() => setParam(k)} className={`rounded-2xl text-left ring-2 transition ${k === prm ? 'ring-ink/80' : 'ring-transparent'}`}><Gauge param={k} reading={latest.get(`${point?.id}|${k}`)} /></button>)}
            </motion.div>
          </AnimatePresence>
          <Card className="p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div><p className="font-semibold">{p.label} · {point?.name}</p><p className="text-xs text-muted">Últimos 7 días con datos · línea roja = límite ({p.norm}){series.length ? ` · hasta ${new Date(series.at(-1).ts).toLocaleDateString('es')}` : ''}</p></div>
              <div className="flex gap-1">{disponibles.map((o) => <button key={o} onClick={() => setOrigen(o)} className={`rounded-lg px-2.5 py-1 text-xs font-medium ${o === origen ? 'bg-ink text-white' : 'border border-line text-muted'}`}>{{ oficial: 'Oficial REMMAQ', modelo: 'Modelo Open-Meteo', interna: 'Interno / demo' }[o]}</button>)}</div>
            </div>
            <div className="h-80">
              <ResponsiveContainer>
                <AreaChart data={series} margin={{ left: -10, right: 10 }}>
                  <defs>
                    <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a8f6a" stopOpacity={0.35} /><stop offset="1" stopColor="#2a8f6a" stopOpacity={0} /></linearGradient>
                    <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c4643f" stopOpacity={0.3} /><stop offset="1" stopColor="#c4643f" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid stroke="#eeece6" vertical={false} />
                  <XAxis dataKey="ts" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(t) => new Date(t).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })} tick={{ fontSize: 11, fill: '#6b6a66' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b6a66' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e4e2dc', fontSize: 12 }} labelFormatter={(t) => new Date(t).toLocaleString('es')} formatter={(v) => [`${fmt(v, 2)} ${p.unit}`, { oficial: 'REMMAQ (oficial)', modelo: 'Open-Meteo (modelo)', interna: 'Interno' }[origen]]} />
                  <ReferenceLine y={p.max} stroke="#b42318" strokeDasharray="5 4" label={{ value: `Límite ${p.max}`, fontSize: 11, fill: '#b42318', position: 'insideTopRight' }} />
                  {p.min != null && <ReferenceLine y={p.min} stroke="#b42318" strokeDasharray="5 4" />}
                  <Area type="monotone" dataKey="interna" stroke="#2a8f6a" strokeWidth={2} fill="url(#gi)" connectNulls animationDuration={900} />
                  <Area type="monotone" dataKey="externa" stroke="#c4643f" strokeWidth={2} fill="url(#ge)" connectNulls animationDuration={900} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
