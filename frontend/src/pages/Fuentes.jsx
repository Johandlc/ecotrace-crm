import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Radio, ClipboardList, ClipboardCheck, Globe, FlaskConical, Landmark, MessageSquare, Upload, RefreshCw, Send, Plus } from 'lucide-react'
import { useStore } from '../store'
import { Badge, Button, Card, Field, PageHeader, inputCls, spring } from '../components/ui'
import { parseCsv, sampleLabCsv } from '../api/external'
import { MEDIA, PARAMS, ago } from '../lib/params'

function Source({ tone, icon: Icon, title, channel, children, i }) {
  return (
    <Card tone={tone} className="p-5" custom={i}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`grid size-10 place-items-center rounded-xl ${tone === 'ext' ? 'bg-ext-100' : 'bg-int-100'}`}><Icon className="size-5" /></div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-xs opacity-75">{channel}</p>
          </div>
        </div>
      </div>
      <div className="text-ink">{children}</div>
    </Card>
  )
}

function ManualForm() {
  const { data, runIngest } = useStore()
  const [pointId, setPoint] = useState(data.points[0].id)
  const pt = data.points.find((p) => p.id === pointId)
  const [param, setParam] = useState(MEDIA[pt.type].params[0])
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    await runIngest([{ pointId, param, value, ts: Date.now() }], { source: 'interna', channel: 'formulario', label: 'Formulario manual' })
    setValue('')
    setBusy(false)
  }
  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-3">
      <Field label="Punto"><select className={inputCls} value={pointId} onChange={(e) => { setPoint(e.target.value); setParam(MEDIA[data.points.find((p) => p.id === e.target.value).type].params[0]) }}>
        {data.points.map((p) => <option key={p.id} value={p.id}>{p.id} · {p.name}</option>)}
      </select></Field>
      <Field label="Parámetro"><select className={inputCls} value={param} onChange={(e) => setParam(e.target.value)}>
        {MEDIA[pt.type].params.map((k) => <option key={k} value={k}>{PARAMS[k].label} ({PARAMS[k].unit || 'u'})</option>)}
      </select></Field>
      <Field label={`Valor · límite ${PARAMS[param].min != null ? `${PARAMS[param].min}–` : '≤ '}${PARAMS[param].max}`}><input required className={inputCls} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Ej. 21.4" /></Field>
      <div className="flex items-end"><Button className="w-full" icon={Send} loading={busy}>Enviar al núcleo</Button></div>
    </form>
  )
}

function AuditForm() {
  const { create } = useStore()
  const [title, setTitle] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    await create('findings', { title, severity: 'media', status: 'abierto', origin: 'auditoría', pointId: null, due: Date.now() + 14 * 86400000, owner: 'Sin asignar' }, 'Hallazgo de auditoría registrado')
    setTitle('')
  }
  return (
    <form onSubmit={submit} className="flex gap-2">
      <input required className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Describe el hallazgo de la auditoría interna" />
      <Button icon={Plus}>Registrar</Button>
    </form>
  )
}

function LabUpload() {
  const { runIngest } = useStore()
  const [csv, setCsv] = useState(sampleLabCsv)
  const [busy, setBusy] = useState(false)
  const go = async () => {
    setBusy(true)
    await runIngest(parseCsv(csv), { source: 'externa', channel: 'laboratorio', label: 'Carga de laboratorio (CSV)' })
    setBusy(false)
  }
  return (
    <div className="space-y-3">
      <textarea className={`${inputCls} h-40 font-mono text-xs`} value={csv} onChange={(e) => setCsv(e.target.value)} spellCheck={false} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted">El lote de ejemplo trae errores a propósito: punto inexistente, valor negativo y parámetro no catalogado.</p>
        <Button variant="ext" icon={Upload} loading={busy} onClick={go}>Integrar lote</Button>
      </div>
    </div>
  )
}

function AuthorityFeed() {
  const { data, create, api, toast } = useStore()
  const [notice, setNotice] = useState(null)
  const [busy, setBusy] = useState(false)
  const pull = async () => {
    setBusy(true)
    try { setNotice(await api.authorityBulletin()) } catch (e) { toast(e.message, 'danger') }
    setBusy(false)
  }
  const accept = async () => {
    await create('requirements', { ...notice, authorityId: data.stakeholders.find((s) => s.type === 'autoridad')?.id, expires: Date.now() + 90 * 86400000, status: 'vigente', pointIds: [] }, 'Nuevo requisito registrado desde la autoridad')
    setNotice(null)
  }
  return (
    <div className="space-y-3">
      <Button variant="ghost" icon={RefreshCw} loading={busy} onClick={pull}>Consultar boletín oficial</Button>
      <AnimatePresence mode="wait">
        {notice && (
          <motion.div key={notice.title} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={spring} className="rounded-xl border border-ext-300/60 bg-white p-4">
            <Badge tone="ext">{notice.kind}</Badge>
            <p className="mt-2 font-medium">{notice.title}</p>
            <p className="mt-1 text-sm text-muted">{notice.obligations}</p>
            <div className="mt-3 flex gap-2">
              <Button variant="ext" onClick={accept}>Registrar como requisito</Button>
              <Button variant="subtle" onClick={() => setNotice(null)}>Descartar</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CommunityForm() {
  const { data, create } = useStore()
  const comm = data.stakeholders.filter((s) => s.type === 'comunidad')
  const [f, setF] = useState({ stakeholderId: comm[0]?.id, subject: '', pointId: '' })
  const submit = async (e) => {
    e.preventDefault()
    await create('complaints', { ...f, channel: 'portal', status: 'abierta', ts: Date.now() }, 'Queja recibida desde el portal comunitario')
    setF({ ...f, subject: '' })
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Remitente"><select className={inputCls} value={f.stakeholderId} onChange={(e) => setF({ ...f, stakeholderId: e.target.value })}>{comm.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
        <Field label="Punto relacionado"><select className={inputCls} value={f.pointId} onChange={(e) => setF({ ...f, pointId: e.target.value })}><option value="">—</option>{data.points.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
      </div>
      <div className="flex gap-2">
        <input required className={inputCls} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} placeholder="Asunto de la queja o solicitud" />
        <Button variant="ext" icon={Send}>Enviar</Button>
      </div>
    </form>
  )
}

export default function Fuentes() {
  const { live, setLive, syncExternal, syncing, data, puede } = useStore()
  const lastApi = data.ingestLog.find((l) => l.channel === 'api')
  return (
    <>
      {!puede('editar') && <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Tu rol es de sólo lectura: puedes ver las fuentes, pero no enviar datos al núcleo.</div>}
      <PageHeader eyebrow="Entrada" title="Fuentes de información" desc="Todo lo que alimenta al núcleo. Las fuentes internas son de la organización; las externas vienen de autoridades, laboratorios, la comunidad y APIs públicas." />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-int-700"><span className="size-2 rounded-full bg-int-500" />Fuentes internas</h2>
          <Source tone="int" icon={Radio} title="Red de sensores" channel="Sensores IoT · interna" i={0}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted">Transmite PM, NO₂, CO₂ y ruido cada pocos segundos hacia la capa de integración.</p>
              <button onClick={() => setLive(!live)} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${live ? 'bg-int-500' : 'bg-stone-300'}`} aria-label="Activar sensores">
                <motion.span layout transition={spring} className={`absolute top-1 size-5 rounded-full bg-white shadow ${live ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </Source>
          <Source tone="int" icon={ClipboardList} title="Monitoreo manual" channel="Formulario · interna" i={1}><ManualForm /></Source>
          <Source tone="int" icon={ClipboardCheck} title="Auditorías internas" channel="Formulario · interna" i={2}><AuditForm /></Source>
        </div>
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ext-700"><span className="size-2 rounded-full bg-ext-500" />Fuentes externas</h2>
          <Source tone="ext" icon={Globe} title="API Open-Meteo · Calidad del aire" channel="API REST pública (CAMS) · externa" i={3}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">PM2.5, PM10, NO₂ y CO₂ de las últimas 12 h para cada estación de aire de Quito. En modo API la consulta la hace el backend.<br />
                {lastApi && <span className="text-xs">Última: {ago(lastApi.ts)} · {lastApi.accepted} lecturas</span>}</p>
              <Button variant="ext" icon={RefreshCw} loading={syncing} onClick={syncExternal}>Sincronizar</Button>
            </div>
          </Source>
          <Source tone="ext" icon={FlaskConical} title="Laboratorios acreditados" channel="Carga CSV · externa" i={4}><LabUpload /></Source>
          <Source tone="ext" icon={Landmark} title="Autoridad ambiental" channel="Boletín regulatorio · externa (simulado)" i={5}><AuthorityFeed /></Source>
          <Source tone="ext" icon={MessageSquare} title="Comunidad" channel="Portal público · externa" i={6}><CommunityForm /></Source>
        </div>
      </div>
    </>
  )
}
