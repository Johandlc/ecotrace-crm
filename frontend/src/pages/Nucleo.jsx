import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Plus, Trash2, Search, Paperclip, MapPin, Landmark, Users } from 'lucide-react'
import { useStore } from '../store'
import { Badge, Button, Card, Empty, Field, Modal, PageHeader, Tabs, inputCls, spring } from '../components/ui'
import { fmtDate, MEDIA } from '../lib/params'

const TYPE_TONE = { autoridad: 'ext', comunidad: 'ext', laboratorio: 'int', auditor: 'int', proveedor: 'muted' }
const SENT = { positivo: 'ok', neutral: 'muted', negativo: 'danger' }

const FORMS = {
  stakeholders: { title: 'Nueva parte interesada', init: { name: '', type: 'comunidad', contact: '', influence: 3, sentiment: 'neutral' } },
  requirements: { title: 'Nuevo requisito', init: { title: '', kind: 'permiso', authorityId: '', expires: '', obligations: '', status: 'vigente', pointIds: [] } },
  points: { title: 'Nuevo punto de monitoreo', init: { name: '', type: 'aire', site: '', lat: '', lon: '' } },
  evidence: { title: 'Nueva evidencia', init: { name: '', entity: 'requirements', entityId: '' } },
}

function Form({ col, onDone }) {
  const { data, create } = useStore()
  const [f, setF] = useState(FORMS[col].init)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault()
    const row = { ...f }
    if (col === 'requirements') row.expires = f.expires ? new Date(f.expires).getTime() : null
    if (col === 'points') { row.lat = +f.lat; row.lon = +f.lon }
    if (col === 'stakeholders') row.influence = +f.influence
    if (col === 'evidence') row.ts = Date.now()
    await create(col, row, `${FORMS[col].title.replace('Nuev', 'Registrad')}`)
    onDone()
  }
  return (
    <form onSubmit={submit} className="grid gap-3">
      {col === 'stakeholders' && <>
        <Field label="Nombre"><input required className={inputCls} value={f.name} onChange={set('name')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo"><select className={inputCls} value={f.type} onChange={set('type')}>{Object.keys(TYPE_TONE).map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Percepción"><select className={inputCls} value={f.sentiment} onChange={set('sentiment')}>{Object.keys(SENT).map((t) => <option key={t}>{t}</option>)}</select></Field>
        </div>
        <Field label="Contacto"><input className={inputCls} value={f.contact} onChange={set('contact')} /></Field>
        <Field label={`Influencia: ${f.influence}`}><input type="range" min="1" max="5" value={f.influence} onChange={set('influence')} className="w-full accent-int-700" /></Field>
      </>}
      {col === 'requirements' && <>
        <Field label="Título"><input required className={inputCls} value={f.title} onChange={set('title')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo"><select className={inputCls} value={f.kind} onChange={set('kind')}><option>permiso</option><option>norma</option></select></Field>
          <Field label="Vence"><input type="date" className={inputCls} value={f.expires} onChange={set('expires')} /></Field>
        </div>
        <Field label="Autoridad"><select className={inputCls} value={f.authorityId} onChange={set('authorityId')}><option value="">—</option>{data.stakeholders.filter((s) => s.type === 'autoridad').map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
        <Field label="Obligaciones"><textarea className={inputCls} value={f.obligations} onChange={set('obligations')} /></Field>
      </>}
      {col === 'points' && <>
        <Field label="Nombre"><input required className={inputCls} value={f.name} onChange={set('name')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Medio"><select className={inputCls} value={f.type} onChange={set('type')}>{Object.keys(MEDIA).map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Sitio"><input required className={inputCls} value={f.site} onChange={set('site')} /></Field>
          <Field label="Latitud"><input required className={inputCls} value={f.lat} onChange={set('lat')} placeholder="19.43" /></Field>
          <Field label="Longitud"><input required className={inputCls} value={f.lon} onChange={set('lon')} placeholder="-99.13" /></Field>
        </div>
        <p className="text-xs text-muted">Los puntos de aire se sincronizan automáticamente con la API externa usando sus coordenadas.</p>
      </>}
      {col === 'evidence' && <>
        <Field label="Nombre del archivo"><input required className={inputCls} value={f.name} onChange={set('name')} placeholder="Informe_monitoreo.pdf" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Asociada a"><select className={inputCls} value={f.entity} onChange={(e) => setF({ ...f, entity: e.target.value, entityId: '' })}><option value="requirements">Requisito</option><option value="findings">Hallazgo</option><option value="complaints">Queja</option></select></Field>
          <Field label="Registro"><select required className={inputCls} value={f.entityId} onChange={set('entityId')}><option value="">—</option>{data[f.entity].map((r) => <option key={r.id} value={r.id}>{r.id} · {(r.title || r.subject).slice(0, 30)}</option>)}</select></Field>
        </div>
      </>}
      <Button className="mt-2">Guardar en el núcleo</Button>
    </form>
  )
}

function Row({ children, onDelete, i }) {
  return (
    <motion.tr layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.025 } }} exit={{ opacity: 0, x: -20 }} transition={spring} className="group border-b border-line last:border-0 hover:bg-stone-50/80">
      {children}
      <td className="w-10 py-3 pr-3 text-right">
        <button onClick={onDelete} className="rounded-lg p-1.5 text-muted opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-700" aria-label="Eliminar"><Trash2 className="size-4" /></button>
      </td>
    </motion.tr>
  )
}

export default function Nucleo() {
  const { data, remove, puede } = useStore()
  const [tab, setTab] = useState('stakeholders')
  const [q, setQ] = useState('')
  const [modal, setModal] = useState(false)
  const name = (id) => data.stakeholders.find((s) => s.id === id)?.name || '—'
  const match = (r) => JSON.stringify(r).toLowerCase().includes(q.toLowerCase())
  const rows = data[tab].filter(match)
  const del = (id) => remove(tab, id, `${id} eliminado del núcleo`)
  const td = 'py-3 px-3 text-sm'
  const th = 'py-2.5 px-3 text-left text-[11px] font-semibold tracking-wider text-muted uppercase'
  const related = (s) => data.requirements.filter((x) => x.authorityId === s.id).length + data.complaints.filter((x) => x.stakeholderId === s.id).length
  return (
    <>
      <PageHeader eyebrow="Núcleo" title="Núcleo de datos único" desc="La fuente de verdad. Cada registro se relaciona: requisitos con autoridades y puntos, quejas con actores, evidencias con todo."
        actions={puede('editar') && <Button icon={Plus} onClick={() => setModal(true)}>Nuevo registro</Button>} />
      <motion.div variants={{ show: {} }} className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs id="core" value={tab} onChange={setTab} tabs={[
          { value: 'stakeholders', label: 'Partes interesadas', count: data.stakeholders.length },
          { value: 'requirements', label: 'Requisitos', count: data.requirements.length },
          { value: 'points', label: 'Puntos de monitoreo', count: data.points.length },
          { value: 'evidence', label: 'Evidencias', count: data.evidence.length },
        ]} />
        <div className="relative md:w-72"><Search className="absolute top-2.5 left-3 size-4 text-muted" /><input className={`${inputCls} pl-9`} placeholder="Buscar en el núcleo…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </motion.div>
      <Card className="overflow-x-auto scroll-thin">
        <AnimatePresence mode="wait">
          <motion.table key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full min-w-[640px]">
            <thead className="border-b border-line bg-stone-50/60">
              {tab === 'stakeholders' && <tr><th className={th}>Nombre</th><th className={th}>Tipo</th><th className={th}>Influencia</th><th className={th}>Percepción</th><th className={th}>Vínculos</th><th /></tr>}
              {tab === 'requirements' && <tr><th className={th}>Requisito</th><th className={th}>Tipo</th><th className={th}>Autoridad</th><th className={th}>Puntos</th><th className={th}>Vence</th><th /></tr>}
              {tab === 'points' && <tr><th className={th}>Punto</th><th className={th}>Medio</th><th className={th}>Sitio</th><th className={th}>Coordenadas</th><th className={th}>Lecturas</th><th /></tr>}
              {tab === 'evidence' && <tr><th className={th}>Archivo</th><th className={th}>Asociada a</th><th className={th}>Fecha</th><th /></tr>}
            </thead>
            <tbody>
              <AnimatePresence>
                {rows.map((r, i) => (
                  <Row key={r.id} i={i} onDelete={() => del(r.id)}>
                    {tab === 'stakeholders' && <>
                      <td className={td}><p className="font-medium">{r.name}</p><p className="text-xs text-muted">{r.contact}</p></td>
                      <td className={td}><Badge tone={TYPE_TONE[r.type]}>{r.type}</Badge></td>
                      <td className={td}><div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((n) => <motion.span key={n} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: n * 0.05 }} className={`h-3 w-1.5 rounded-full ${n <= r.influence ? 'bg-int-500' : 'bg-stone-200'}`} />)}</div></td>
                      <td className={td}><Badge tone={SENT[r.sentiment]} dot>{r.sentiment}</Badge></td>
                      <td className={`${td} text-muted`}>{related(r)}</td>
                    </>}
                    {tab === 'requirements' && <>
                      <td className={td}><p className="font-medium">{r.title}</p><p className="line-clamp-1 text-xs text-muted">{r.obligations}</p></td>
                      <td className={td}><Badge tone={r.kind === 'permiso' ? 'int' : 'muted'}>{r.kind}</Badge></td>
                      <td className={td}><span className="flex items-center gap-1.5"><Landmark className="size-3.5 text-ext-500" />{name(r.authorityId)}</span></td>
                      <td className={td}><div className="flex flex-wrap gap-1">{(r.pointIds || []).map((p) => <Badge key={p}>{p}</Badge>)}</div></td>
                      <td className={`${td} whitespace-nowrap`}>{r.expires ? fmtDate(r.expires) : 'Permanente'}</td>
                    </>}
                    {tab === 'points' && <>
                      <td className={td}><p className="font-medium">{r.name}</p><p className="font-mono text-xs text-muted">{r.id}</p></td>
                      <td className={td}><Badge tone={r.type === 'aire' ? 'int' : r.type === 'agua' ? 'ext' : 'muted'}>{r.type}</Badge></td>
                      <td className={td}>{r.site}</td>
                      <td className={`${td} font-mono text-xs text-muted`}><MapPin className="mr-1 inline size-3" />{r.lat}, {r.lon}</td>
                      <td className={td}>{data.readings.filter((x) => x.pointId === r.id).length}</td>
                    </>}
                    {tab === 'evidence' && <>
                      <td className={td}><span className="flex items-center gap-2 font-medium"><Paperclip className="size-4 text-muted" />{r.name}</span></td>
                      <td className={td}><Badge>{r.entityId}</Badge></td>
                      <td className={td}>{fmtDate(r.ts)}</td>
                    </>}
                  </Row>
                ))}
              </AnimatePresence>
            </tbody>
          </motion.table>
        </AnimatePresence>
        {!rows.length && <Empty icon={Users} text="Sin resultados" />}
      </Card>
      <Modal open={modal} onClose={() => setModal(false)} title={FORMS[tab].title}><Form col={tab} onDone={() => setModal(false)} /></Modal>
    </>
  )
}
