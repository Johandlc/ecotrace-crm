import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Printer, Download, FileJson, Leaf, MapPin, Wind } from 'lucide-react'
import { useStore } from '../store'
import { Badge, Button, Card, Field, PageHeader, Tabs, inputCls } from '../components/ui'
import { MEDIA, PARAMS, fmt, fmtDate, daysUntil } from '../lib/params'
import { ZONAS } from '../data/quito'

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  a.click()
  URL.revokeObjectURL(url)
}

function useReport(reqId, hours) {
  const { data } = useStore()
  return useMemo(() => {
    const q = data.requirements.find((r) => r.id === reqId)
    const since = Date.now() - hours * 3600000
    const rows = []
    for (const pid of q?.pointIds || []) {
      const pt = data.points.find((p) => p.id === pid)
      if (!pt) continue
      for (const k of MEDIA[pt.type].params) {
        const rs = data.readings.filter((r) => r.pointId === pid && r.param === k && r.ts >= since)
        if (!rs.length) continue
        const vals = rs.map((r) => r.value)
        rows.push({ punto: pid, nombre: pt.name, parametro: PARAMS[k].label, unidad: PARAMS[k].unit, n: rs.length, promedio: +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2), maximo: Math.max(...vals), limite: PARAMS[k].max, excedencias: rs.filter((r) => r.exceed).length })
      }
    }
    const findings = data.findings.filter((f) => q?.pointIds?.includes(f.pointId))
    const evidence = data.evidence.filter((e) => e.entityId === q?.id || findings.some((f) => f.id === e.entityId))
    return { q, rows, findings, evidence, authority: data.stakeholders.find((s) => s.id === q?.authorityId) }
  }, [data, reqId, hours])
}

function Authority() {
  const { data } = useStore()
  const permits = data.requirements.filter((r) => r.pointIds?.length)
  const [reqId, setReq] = useState(permits[0]?.id)
  const [hours, setHours] = useState(48)
  const rep = useReport(reqId, hours)
  const exc = rep.rows.reduce((a, r) => a + r.excedencias, 0)
  const csv = () => {
    const head = Object.keys(rep.rows[0] || { punto: '' })
    download(`informe_${reqId}.csv`, [head.join(','), ...rep.rows.map((r) => head.map((h) => r[h]).join(','))].join('\n'), 'text/csv')
  }
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <Card className="h-fit space-y-4 p-5 print:hidden lg:col-span-4">
        <Field label="Requisito / permiso"><select className={inputCls} value={reqId} onChange={(e) => setReq(e.target.value)}>{permits.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></Field>
        <Field label="Periodo"><select className={inputCls} value={hours} onChange={(e) => setHours(+e.target.value)}><option value={24}>Últimas 24 h</option><option value={48}>Últimas 48 h</option><option value={168}>Últimos 7 días</option></select></Field>
        <div className="grid gap-2">
          <Button icon={Printer} onClick={() => window.print()}>Imprimir / PDF</Button>
          <Button variant="ghost" icon={Download} onClick={csv}>Descargar CSV</Button>
          <Button variant="ghost" icon={FileJson} onClick={() => download(`informe_${reqId}.json`, JSON.stringify(rep, null, 2), 'application/json')}>Descargar JSON (API)</Button>
        </div>
      </Card>
      <AnimatePresence mode="wait">
        <motion.article key={reqId + hours} initial={{ opacity: 0, y: 16, rotateX: 4 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}
          className="rounded-2xl border border-line bg-white p-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,.2)] md:p-10 lg:col-span-8 print:border-0 print:shadow-none">
          <div className="flex items-start justify-between border-b border-line pb-5">
            <div><p className="text-xs font-semibold tracking-[.14em] text-ext-700 uppercase">Informe de cumplimiento</p><h2 className="mt-1 text-xl font-semibold">{rep.q?.title}</h2><p className="text-sm text-muted">Para: {rep.authority?.name || '—'} · Emitido {fmtDate(Date.now())}</p></div>
            <Leaf className="size-8 text-int-700" />
          </div>
          <section className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl bg-stone-50 p-3"><p className="text-2xl font-semibold">{rep.rows.reduce((a, r) => a + r.n, 0)}</p><p className="text-xs text-muted">mediciones</p></div>
            <div className={`rounded-xl p-3 ${exc ? 'bg-red-50 text-red-700' : 'bg-int-50 text-int-700'}`}><p className="text-2xl font-semibold">{exc}</p><p className="text-xs">excedencias</p></div>
            <div className="rounded-xl bg-stone-50 p-3"><p className="text-2xl font-semibold">{rep.findings.filter((f) => f.status !== 'cerrado').length}</p><p className="text-xs text-muted">hallazgos abiertos</p></div>
          </section>
          <h3 className="mt-6 mb-2 text-sm font-semibold">1. Obligaciones</h3>
          <p className="text-sm text-muted">{rep.q?.obligations} {rep.q?.expires && `Vigencia hasta ${fmtDate(rep.q.expires)} (${daysUntil(rep.q.expires)} días).`}</p>
          <h3 className="mt-6 mb-2 text-sm font-semibold">2. Resultados de monitoreo</h3>
          <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-sm">
            <thead className="text-left text-[11px] tracking-wider text-muted uppercase"><tr><th className="py-2">Punto</th><th>Parámetro</th><th className="text-right">Prom.</th><th className="text-right">Máx.</th><th className="text-right">Límite</th><th className="text-right">Exc.</th></tr></thead>
            <tbody>{rep.rows.map((r, i) => (
              <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.04 }} className="border-t border-line">
                <td className="py-2">{r.punto}</td><td>{r.parametro} <span className="text-xs text-muted">{r.unidad}</span></td><td className="text-right tabular-nums">{fmt(r.promedio, 2)}</td><td className="text-right tabular-nums">{fmt(r.maximo, 2)}</td><td className="text-right tabular-nums">{r.limite}</td>
                <td className="text-right">{r.excedencias ? <Badge tone="danger">{r.excedencias}</Badge> : <span className="text-int-700">0</span>}</td>
              </motion.tr>
            ))}</tbody>
          </table></div>
          <h3 className="mt-6 mb-2 text-sm font-semibold">3. No conformidades y acciones</h3>
          {rep.findings.length ? rep.findings.map((f) => <p key={f.id} className="flex items-center justify-between gap-3 border-t border-line py-2 text-sm"><span>{f.id} · {f.title}</span><Badge tone={f.status === 'cerrado' ? 'ok' : 'warn'}>{f.status}</Badge></p>) : <p className="text-sm text-muted">Sin no conformidades en el periodo.</p>}
          <h3 className="mt-6 mb-2 text-sm font-semibold">4. Evidencias anexas</h3>
          <p className="text-sm text-muted">{rep.evidence.map((e) => e.name).join(' · ') || 'Ninguna'}</p>
        </motion.article>
      </AnimatePresence>
    </div>
  )
}

const AQ = [
  { max: 12, l: 'Buena', c: 'bg-int-500' },
  { max: 25, l: 'Moderada', c: 'bg-amber-400' },
  { max: 50, l: 'Dañina para grupos sensibles', c: 'bg-ext-500' },
  { max: Infinity, l: 'Dañina', c: 'bg-danger' },
]

function Portal() {
  const { data } = useStore()
  const zoneName = Object.fromEntries(ZONAS.map((z) => [z.id, z.name]))
  const sites = [...new Set(data.points.map((p) => p.zoneId || p.site))]
  return (
    <div className="rounded-3xl border border-ext-300/50 bg-gradient-to-b from-ext-50 to-white p-6 md:p-10">
      <div className="mb-8 text-center">
        <Badge tone="ext">Vista pública · datos agregados</Badge>
        <h2 className="mt-3 text-2xl font-semibold md:text-3xl">Portal de transparencia ambiental · Quito</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted">Información para vecinos, ONG y autoridades. Sin datos personales; se actualiza con cada integración validada.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {sites.map((s, i) => {
          const pts = data.points.filter((p) => (p.zoneId || p.site) === s)
          const pm = data.readings.filter((r) => pts.some((p) => p.id === r.pointId) && r.param === 'pm2_5' && r.ts > Date.now() - 24 * 3600000)
          const avg = pm.length ? pm.reduce((a, r) => a + r.value, 0) / pm.length : null
          const aq = avg == null ? null : AQ.find((a) => avg <= a.max)
          const reqs = data.requirements.filter((q) => q.pointIds?.some((id) => pts.some((p) => p.id === id)))
          const ok = reqs.filter((q) => !q.expires || q.expires > Date.now()).length
          return (
            <motion.div key={s} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ y: -4 }} className="rounded-2xl border border-line bg-white p-5">
              <p className="flex items-center gap-1.5 text-xs text-muted"><MapPin className="size-3.5" />{pts.length} puntos de monitoreo</p>
              <h3 className="mt-1 text-lg font-semibold">{zoneName[s] || s}</h3>
              <div className="mt-4 flex items-center gap-3">
                <div className={`grid size-12 place-items-center rounded-2xl text-white ${aq?.c || 'bg-stone-300'}`}><Wind className="size-5" /></div>
                <div><p className="text-sm font-medium">Calidad del aire: {aq?.l || 'Sin medición de aire'}</p>{avg != null && <p className="text-xs text-muted">PM2.5 promedio 24 h: {fmt(avg)} µg/m³</p>}</div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted">Permisos al día</span><span className="font-semibold">{ok}/{reqs.length}</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-stone-100"><motion.div initial={{ width: 0 }} animate={{ width: `${(ok / Math.max(1, reqs.length)) * 100}%` }} transition={{ duration: 1, delay: 0.3 + i * 0.1 }} className="h-full rounded-full bg-int-500" /></div>
            </motion.div>
          )
        })}
      </div>
      <p className="mt-8 text-center text-sm text-muted">¿Tienes una queja o solicitud? <a href="#/fuentes" className="font-medium text-ext-700 underline underline-offset-4">Envíala por el canal comunitario</a></p>
    </div>
  )
}

export default function Reportes() {
  const [tab, setTab] = useState('autoridad')
  return (
    <>
      <PageHeader eyebrow="Salida" tone="ext" title="Reportes y portal" desc="Informes listos para la autoridad (imprimibles y exportables) y un portal público con información agregada para partes externas."
        actions={<div className="print:hidden"><Tabs id="rep" value={tab} onChange={setTab} tabs={[{ value: 'autoridad', label: 'Informe a la autoridad' }, { value: 'portal', label: 'Portal público' }]} /></div>} />
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
          {tab === 'autoridad' ? <Authority /> : <Portal />}
        </motion.div>
      </AnimatePresence>
    </>
  )
}
