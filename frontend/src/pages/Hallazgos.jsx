import { useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Calendar, Plus, User, Paperclip } from 'lucide-react'
import { useStore } from '../store'
import { Badge, Button, Card, Field, Modal, PageHeader, SEV, inputCls, spring } from '../components/ui'
import { daysUntil, fmtDate } from '../lib/params'

const COLS = [
  { id: 'abierto', label: 'Abiertos', dot: 'bg-danger' },
  { id: 'en curso', label: 'En curso', dot: 'bg-warn' },
  { id: 'cerrado', label: 'Cerrados', dot: 'bg-int-500' },
]

function Detail({ f, onClose }) {
  const { data, update, create } = useStore()
  const [owner, setOwner] = useState(f.owner)
  const [ev, setEv] = useState('')
  const evs = data.evidence.filter((e) => e.entityId === f.id)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5"><Badge tone={SEV[f.severity]}>Severidad {f.severity}</Badge><Badge>{f.origin}</Badge>{f.pointId && <Badge>{f.pointId}</Badge>}</div>
      <p className="font-medium">{f.title}</p>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Responsable"><input className={inputCls} value={owner} onChange={(e) => setOwner(e.target.value)} onBlur={() => owner !== f.owner && update('findings', f.id, { owner }, `Responsable de ${f.id} actualizado`)} /></Field>
        <Field label="Severidad"><select className={inputCls} value={f.severity} onChange={(e) => update('findings', f.id, { severity: e.target.value })}><option>alta</option><option>media</option><option>baja</option></select></Field>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-muted">Evidencias</p>
        {evs.map((e) => <p key={e.id} className="flex items-center gap-2 py-1 text-sm"><Paperclip className="size-3.5 text-muted" />{e.name}</p>)}
        <form className="mt-2 flex gap-2" onSubmit={async (e) => { e.preventDefault(); await create('evidence', { name: ev, entity: 'findings', entityId: f.id, ts: Date.now() }, 'Evidencia adjuntada'); setEv('') }}>
          <input required className={inputCls} value={ev} onChange={(e) => setEv(e.target.value)} placeholder="Nombre del archivo de evidencia" /><Button variant="ghost" icon={Plus}>Adjuntar</Button>
        </form>
      </div>
      <div className="flex justify-end gap-2 border-t border-line pt-4">
        {f.status !== 'cerrado' && <Button onClick={async () => { await update('findings', f.id, { status: 'cerrado' }, `${f.id} cerrado`); onClose() }}>Cerrar no conformidad</Button>}
      </div>
    </div>
  )
}

export default function Hallazgos() {
  const { data, update, create, puede } = useStore()
  const [open, setOpen] = useState(null)
  const [nuevo, setNuevo] = useState(false)
  const [title, setTitle] = useState('')
  const move = (f, dir) => {
    const i = COLS.findIndex((c) => c.id === f.status) + dir
    if (COLS[i]) update('findings', f.id, { status: COLS[i].id }, `${f.id} → ${COLS[i].label.toLowerCase()}`)
  }
  const current = data.findings.find((f) => f.id === open)
  return (
    <>
      <PageHeader eyebrow="Módulo" tone="int" title="Hallazgos y no conformidades" desc="Las excedencias de monitoreo crean hallazgos automáticamente. Muévelos por el tablero hasta cerrarlos con evidencia."
        actions={puede('editar') && <Button icon={Plus} onClick={() => setNuevo(true)}>Nuevo hallazgo</Button>} />
      <LayoutGroup>
        <div className="grid gap-4 md:grid-cols-3">
          {COLS.map((c) => {
            const items = data.findings.filter((f) => f.status === c.id)
            return (
              <Card key={c.id} className="bg-stone-50/70 p-3">
                <div className="mb-3 flex items-center gap-2 px-1"><span className={`size-2 rounded-full ${c.dot}`} /><p className="text-sm font-semibold">{c.label}</p><span className="text-xs text-muted">{items.length}</span></div>
                <div className="min-h-24 space-y-2">
                  <AnimatePresence>
                    {items.map((f) => {
                      const d = daysUntil(f.due)
                      const late = f.status !== 'cerrado' && d < 0
                      return (
                        <motion.div key={f.id} layoutId={f.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={spring}
                          whileHover={{ y: -2 }} className="group cursor-pointer rounded-xl border border-line bg-white p-3 shadow-[0_1px_0_rgba(0,0,0,.03)]" onClick={() => setOpen(f.id)}>
                          <div className="mb-1.5 flex items-center justify-between gap-2"><Badge tone={SEV[f.severity]}>{f.severity}</Badge><span className="font-mono text-[10px] text-muted">{f.id}</span></div>
                          <p className="text-sm leading-snug font-medium">{f.title}</p>
                          <div className="mt-2.5 flex items-center gap-3 text-[11px] text-muted">
                            <span className="flex items-center gap-1"><User className="size-3" />{f.owner}</span>
                            <span className={`flex items-center gap-1 ${late ? 'font-semibold text-danger' : ''}`}><Calendar className="size-3" />{late ? `${-d} d atrasado` : fmtDate(f.due)}</span>
                          </div>
                          <div className="mt-2 flex justify-between opacity-0 transition group-hover:opacity-100">
                            <button disabled={c.id === 'abierto'} onClick={(e) => { e.stopPropagation(); move(f, -1) }} className="rounded-md p-1 hover:bg-stone-100 disabled:invisible" aria-label="Mover atrás"><ArrowLeft className="size-3.5" /></button>
                            <button disabled={c.id === 'cerrado'} onClick={(e) => { e.stopPropagation(); move(f, 1) }} className="rounded-md p-1 hover:bg-stone-100 disabled:invisible" aria-label="Avanzar"><ArrowRight className="size-3.5" /></button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </Card>
            )
          })}
        </div>
      </LayoutGroup>
      <Modal open={!!current} onClose={() => setOpen(null)} title={`Hallazgo ${current?.id || ''}`}>{current && <Detail f={current} onClose={() => setOpen(null)} />}</Modal>
      <Modal open={nuevo} onClose={() => setNuevo(false)} title="Nuevo hallazgo">
        <form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); await create('findings', { title, severity: 'media', status: 'abierto', origin: 'inspección', pointId: null, due: Date.now() + 14 * 86400000, owner: 'Sin asignar' }, 'Hallazgo registrado'); setTitle(''); setNuevo(false) }}>
          <Field label="Descripción"><input required className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          <Button className="w-full">Crear</Button>
        </form>
      </Modal>
    </>
  )
}
