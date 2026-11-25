import { motion } from 'motion/react'
import { ShieldCheck, Clock, Landmark, MapPin, Paperclip } from 'lucide-react'
import { useStore } from '../store'
import { AnimatedNumber, Badge, Card, PageHeader, Stat, fadeUp } from '../components/ui'
import { daysUntil } from '../lib/params'

function Ring({ value }) {
  const r = 52, c = 2 * Math.PI * r
  return (
    <div className="relative size-36">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e3f5ee" strokeWidth="12" />
        <motion.circle cx="60" cy="60" r={r} fill="none" stroke="#0f6b4f" strokeWidth="12" strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - value / 100) }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div><p className="text-3xl font-semibold text-int-900"><AnimatedNumber value={value} />%</p><p className="text-[11px] text-muted">cumplimiento</p></div>
      </div>
    </div>
  )
}

export default function Cumplimiento() {
  const { data, update } = useStore()
  const reqs = [...data.requirements].sort((a, b) => (a.expires ?? Infinity) - (b.expires ?? Infinity))
  const ok = reqs.filter((q) => !q.expires || q.expires > Date.now()).length
  const soon = reqs.filter((q) => q.expires && daysUntil(q.expires) >= 0 && daysUntil(q.expires) <= 60).length
  const expired = reqs.length - ok
  const name = (id) => data.stakeholders.find((s) => s.id === id)?.name || '—'
  const evid = (id) => data.evidence.filter((e) => e.entityId === id).length
  const exc = (pts = []) => data.readings.filter((r) => pts.includes(r.pointId) && r.exceed && r.ts > Date.now() - 86400000).length
  return (
    <>
      <PageHeader eyebrow="Módulo" tone="int" title="Cumplimiento" desc="Permisos y normas aplicables, con sus obligaciones, vencimientos, puntos de monitoreo asociados y evidencias." />
      <div className="mb-6 grid gap-3 md:grid-cols-4">
        <Card tone="int" className="flex items-center justify-center p-4 md:row-span-1"><Ring value={(ok / Math.max(1, reqs.length)) * 100} /></Card>
        <Stat i={1} label="Vigentes" value={ok} icon={ShieldCheck} tone="int" />
        <Stat i={2} label="Vencen en ≤ 60 días" value={soon} icon={Clock} tone={soon ? 'warn' : 'neutral'} />
        <Stat i={3} label="Vencidos" value={expired} tone={expired ? 'danger' : 'neutral'} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {reqs.map((q, i) => {
          const d = q.expires ? daysUntil(q.expires) : null
          const tone = d == null ? 'muted' : d < 0 ? 'danger' : d <= 30 ? 'warn' : 'ok'
          const pct = d == null ? 100 : Math.max(0, Math.min(100, (d / 365) * 100))
          const e = exc(q.pointIds)
          return (
            <Card key={q.id} hover custom={i} variants={fadeUp} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-1.5 flex gap-1.5"><Badge tone={q.kind === 'permiso' ? 'int' : 'muted'}>{q.kind}</Badge><Badge tone={tone} dot>{d == null ? 'Permanente' : d < 0 ? `Vencido hace ${-d} d` : `${d} días`}</Badge></div>
                  <h3 className="font-semibold">{q.title}</h3>
                </div>
                <span className="font-mono text-xs text-muted">{q.id}</span>
              </div>
              <p className="mt-2 text-sm text-muted">{q.obligations}</p>
              {d != null && (
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-stone-100">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.2 + i * 0.05 }} className={`h-full rounded-full ${tone === 'danger' ? 'bg-danger' : tone === 'warn' ? 'bg-warn' : 'bg-int-500'}`} />
                </div>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
                <span className="flex items-center gap-1"><Landmark className="size-3.5" />{name(q.authorityId)}</span>
                <span className="flex items-center gap-1"><MapPin className="size-3.5" />{(q.pointIds || []).join(', ') || '—'}</span>
                <span className="flex items-center gap-1"><Paperclip className="size-3.5" />{evid(q.id)} evidencias</span>
                {e > 0 && <Badge tone="danger">{e} excedencias 24 h</Badge>}
                {d != null && d < 60 && (
                  <button onClick={() => update('requirements', q.id, { expires: Date.now() + 365 * 86400000, status: 'vigente' }, `${q.title} renovado por 1 año`)} className="ml-auto rounded-lg border border-line px-2 py-1 font-medium text-ink hover:bg-stone-50">Registrar renovación</button>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </>
  )
}
