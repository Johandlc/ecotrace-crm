import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { MessageSquare, Mail, Landmark, Users, FlaskConical, BadgeCheck } from 'lucide-react'
import { useStore } from '../store'
import { Badge, Card, PageHeader, Stat, Tabs, fadeUp, spring } from '../components/ui'
import { ago, fmtDate } from '../lib/params'

const TICON = { autoridad: Landmark, comunidad: Users, laboratorio: FlaskConical, auditor: BadgeCheck }
const ST = { abierta: 'danger', 'en gestión': 'warn', cerrada: 'ok' }
const NEXT = { abierta: 'en gestión', 'en gestión': 'cerrada' }

export default function Relaciones() {
  const { data, update } = useStore()
  const [sel, setSel] = useState(null)
  const [filter, setFilter] = useState('todas')
  const name = (id) => data.stakeholders.find((s) => s.id === id)?.name
  const cs = data.complaints.filter((c) => (filter === 'todas' ? true : filter === 'abiertas' ? c.status !== 'cerrada' : c.status === 'cerrada')).filter((c) => !sel || c.stakeholderId === sel)
  const open = data.complaints.filter((c) => c.status !== 'cerrada').length
  return (
    <>
      <PageHeader eyebrow="Módulo" tone="ext" title="Relaciones con partes interesadas" desc="Quejas, solicitudes y relación con comunidad, ONG y autoridades. Selecciona un actor para ver su historial." />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat i={0} label="Quejas abiertas" value={open} tone={open ? 'ext' : 'neutral'} icon={MessageSquare} />
        <Stat i={1} label="Total histórico" value={data.complaints.length} />
        <Stat i={2} label="Actores con percepción negativa" value={data.stakeholders.filter((s) => s.sentiment === 'negativo').length} tone="warn" />
        <Stat i={3} label="Partes interesadas" value={data.stakeholders.length} icon={Users} />
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="grid content-start gap-3 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1 xl:grid-cols-2">
          {data.stakeholders.map((s, i) => {
            const Icon = TICON[s.type] || Users
            const n = data.complaints.filter((c) => c.stakeholderId === s.id && c.status !== 'cerrada').length
            const active = sel === s.id
            return (
              <Card key={s.id} custom={i} variants={fadeUp} hover tone={s.type === 'autoridad' || s.type === 'comunidad' ? 'ext' : 'int'} onClick={() => setSel(active ? null : s.id)}
                className={`relative cursor-pointer p-4 ${active ? 'ring-2 ring-ink' : ''}`}>
                <div className="flex items-center gap-2"><Icon className="size-4" /><p className="text-xs font-medium capitalize">{s.type}</p>{n > 0 && <span className="ml-auto rounded-full bg-ext-700 px-1.5 text-[10px] font-semibold text-white">{n}</span>}</div>
                <p className="mt-2 leading-snug font-semibold text-ink">{s.name}</p>
                <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted"><Mail className="size-3" />{s.contact}</p>
              </Card>
            )
          })}
        </div>
        <Card className="p-5 lg:col-span-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">{sel ? `Historial · ${name(sel)}` : 'Bandeja de quejas y solicitudes'}</p>
            <Tabs id="cf" value={filter} onChange={setFilter} tabs={[{ value: 'todas', label: 'Todas' }, { value: 'abiertas', label: 'Abiertas' }, { value: 'cerradas', label: 'Cerradas' }]} />
          </div>
          <motion.ul layout className="space-y-2">
            <AnimatePresence mode="popLayout">
              {cs.map((c) => (
                <motion.li key={c.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={spring} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3">
                  <div className="grid size-9 place-items-center rounded-full bg-ext-50 text-sm font-semibold text-ext-700">{name(c.stakeholderId)?.[0]}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{c.subject}</p>
                    <p className="text-xs text-muted">{name(c.stakeholderId)} · vía {c.channel} · {fmtDate(c.ts)} ({ago(c.ts)}){c.pointId && ` · ${c.pointId}`}</p>
                  </div>
                  <Badge tone={ST[c.status]} dot>{c.status}</Badge>
                  {NEXT[c.status] && <button onClick={() => update('complaints', c.id, { status: NEXT[c.status] }, `Queja ${c.id}: ${NEXT[c.status]}`)} className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium hover:bg-stone-50">{c.status === 'abierta' ? 'Gestionar' : 'Cerrar'}</button>}
                </motion.li>
              ))}
            </AnimatePresence>
            {!cs.length && <p className="py-8 text-center text-sm text-muted">Sin registros</p>}
          </motion.ul>
        </Card>
      </div>
    </>
  )
}
