import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronRight, Inbox, Wand2, ShieldCheck, Database, CircleX } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useStore } from '../store'
import { STAGES } from '../api/integration'
import { Badge, Card, Empty, PageHeader, Stat, spring } from '../components/ui'
import { fmtTime } from '../lib/params'

const ICONS = [Inbox, Wand2, ShieldCheck, Database]
const STAGE_DESC = ['Lote recibido desde la fuente', 'Alias, unidades y fechas homologadas', 'Punto, parámetro, rango y duplicados', 'Escrito en el núcleo + reglas de negocio']

function Pipeline() {
  const { stage } = useStore()
  return (
    <Card className="p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold tracking-[.14em] text-muted uppercase">Pipeline de validación</p>
        <Badge tone={stage >= 0 ? 'int' : 'muted'} dot>{stage >= 0 ? 'Procesando lote' : 'En espera'}</Badge>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        {STAGES.map((s, i) => {
          const Icon = ICONS[i]
          const done = stage > i || stage === 3
          const active = stage === i && stage !== 3
          return (
            <div key={s} className="relative flex items-center gap-3 md:block">
              <motion.div animate={{ scale: active ? 1.04 : 1, backgroundColor: done ? '#e3f5ee' : active ? '#ffffff' : '#fafaf8', borderColor: done || active ? '#2a8f6a' : '#e4e2dc' }} transition={spring}
                className="relative flex flex-1 items-center gap-3 overflow-hidden rounded-xl border p-3 md:flex-col md:items-start">
                {active && <motion.span className="absolute inset-x-0 bottom-0 h-0.5 bg-int-500" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.38 }} style={{ originX: 0 }} />}
                <div className={`grid size-9 place-items-center rounded-lg ${done ? 'bg-int-700 text-white' : 'bg-stone-100 text-muted'}`}>
                  <AnimatePresence mode="wait">{done ? <motion.span key="c" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}><Check className="size-4" /></motion.span> : <Icon className="size-4" />}</AnimatePresence>
                </div>
                <div><p className="text-sm font-semibold">{i + 1}. {s}</p><p className="text-xs text-muted">{STAGE_DESC[i]}</p></div>
              </motion.div>
              {i < 3 && <ChevronRight className="absolute top-1/2 -right-3 z-10 hidden size-4 -translate-y-1/2 text-stone-400 md:block" />}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export default function Integracion() {
  const { data } = useStore()
  const [open, setOpen] = useState(null)
  const logs = data.ingestLog
  const tot = logs.reduce((a, l) => ({ r: a.r + l.received, a: a.a + l.accepted, x: a.x + l.rejected, dup: a.dup + (l.duplicates || 0), e: a.e + l.exceedances }), { r: 0, a: 0, x: 0, dup: 0, e: 0 })
  const chart = logs.slice(0, 14).reverse().map((l, i) => ({ n: `#${i + 1}`, Aceptados: l.accepted, 'Ya existían': l.duplicates || 0, Rechazados: l.rejected, label: l.label }))
  return (
    <>
      <PageHeader eyebrow="Entrada" title="Integración y validación" desc="Ningún dato llega al núcleo sin pasar por aquí: APIs, formularios, cargas de laboratorio y sensores comparten las mismas reglas." />
      <motion.div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat i={0} label="Registros recibidos" value={tot.r} />
        <Stat i={1} label="Aceptados (nuevos)" value={tot.a} tone="int" hint={`${tot.dup} ya existían (omitidos)`} />
        <Stat i={2} label="Rechazados" value={tot.x} tone={tot.x ? 'warn' : 'neutral'} />
        <Stat i={3} label="Excedencias detectadas" value={tot.e} tone={tot.e ? 'ext' : 'neutral'} />
      </motion.div>
      <div className="mb-6"><Pipeline /></div>
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <p className="mb-3 text-xs font-semibold tracking-[.14em] text-muted uppercase">Bitácora de lotes</p>
          {!logs.length && <Empty icon={Inbox} text="Aún no hay lotes" />}
          <motion.ul layout className="divide-y divide-line">
            <AnimatePresence initial={false}>
              {logs.slice(0, 25).map((l) => (
                <motion.li key={l.id} layout initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="py-3">
                  <button className="flex w-full items-center gap-3 text-left" onClick={() => setOpen(open === l.id ? null : l.id)}>
                    <span className={`size-2 shrink-0 rounded-full ${l.source === 'externa' ? 'bg-ext-500' : 'bg-int-500'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{l.label}</p>
                      <p className="text-xs text-muted">{fmtTime(l.ts)} · {l.channel}</p>
                    </div>
                    <Badge tone="int">{l.accepted} ok</Badge>
                    {l.duplicates > 0 && <Badge tone="muted">{l.duplicates} ya existían</Badge>}
                    {l.rejected > 0 && <Badge tone="warn">{l.rejected} rech.</Badge>}
                    {l.exceedances > 0 && <Badge tone="danger">{l.exceedances} exc.</Badge>}
                    <motion.span animate={{ rotate: open === l.id ? 90 : 0 }}><ChevronRight className="size-4 text-muted" /></motion.span>
                  </button>
                  <AnimatePresence>
                    {open === l.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="mt-3 rounded-xl bg-stone-50 p-3 text-sm">
                          {l.errors.length ? l.errors.map((e, i) => (
                            <p key={i} className="flex items-center gap-2 py-0.5 text-red-700"><CircleX className="size-3.5" /><span className="font-mono text-xs">fila {e.row}</span>{e.reason}</p>
                          )) : <p className="text-int-700">Todos los registros pasaron la validación.</p>}
                          {l.findings > 0 && <p className="mt-2 text-xs text-muted">Generó {l.findings} hallazgo(s) automático(s).</p>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <p className="mb-3 text-xs font-semibold tracking-[.14em] text-muted uppercase">Nuevos, ya existentes y rechazados por lote</p>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={chart} margin={{ left: -20 }}>
                <XAxis dataKey="n" tick={{ fontSize: 11, fill: '#6b6a66' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b6a66' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f2f0ea' }} contentStyle={{ borderRadius: 12, border: '1px solid #e4e2dc', fontSize: 12 }} labelFormatter={(_, p) => p?.[0]?.payload.label} />
                <Bar dataKey="Aceptados" stackId="a" fill="#2a8f6a" />
                <Bar dataKey="Ya existían" stackId="a" fill="#d6d3cc" />
                <Bar dataKey="Rechazados" stackId="a" fill="#c4643f" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </>
  )
}
