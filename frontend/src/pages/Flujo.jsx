import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Factory, Globe, Shuffle, Database, ShieldCheck, Activity, TriangleAlert, Users, LayoutDashboard, FileText, Wind, Gauge, Bell, Sparkles } from 'lucide-react'
import { useStore } from '../store'
import { AnimatedNumber, Card, PageHeader, Stat, fadeUp, spring } from '../components/ui'
import { ago } from '../lib/params'

const DESC = {
  fuentes_int: 'Monitoreos propios (sensores, chimeneas), permisos y auditorías internas. Entran por API interna, formularios y la red de sensores.',
  fuentes_ext: 'Autoridades ambientales, laboratorios acreditados, comunidad y la API pública de calidad del aire (Open-Meteo / CAMS) para las estaciones de Quito.',
  integracion: 'En el backend Spring Boot cada lote se normaliza (alias y unidades), se valida (punto, parámetro, rango, duplicados) y sólo lo válido llega al núcleo.',
  nucleo: 'Una sola fuente de verdad: partes interesadas, requisitos, puntos de monitoreo y evidencias, todos relacionados entre sí.',
  cumplimiento: 'Permisos y normas con sus obligaciones, vencimientos y puntos asociados.',
  monitoreo: 'Series de agua, aire (PM, NO₂, CO₂) y ruido contra sus límites normativos.',
  hallazgos: 'No conformidades: se crean solas cuando una lectura excede el límite y se gestionan en tablero.',
  relaciones: 'Quejas y relación con comunidad, ONG y autoridades, con historial por parte interesada.',
  tableros: 'Alertas por límites excedidos, vencimientos, hallazgos atrasados y quejas sin respuesta.',
  reportes: 'Informes para la autoridad y portal de transparencia para partes externas.',
}

function Arrow({ tone = 'int', fast, delay = 0, h = 52 }) {
  const c = tone === 'ext' ? 'bg-ext-500' : tone === 'int' ? 'bg-int-500' : 'bg-stone-500'
  return (
    <div className="relative mx-auto w-px" style={{ height: h }}>
      <motion.div initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.5, delay: 0.2 + delay }} className="absolute inset-0 origin-top bg-stone-400/70" />
      {[0, 0.5].map((d) => (
        <motion.span key={d} className={`absolute -left-[3px] size-[7px] rounded-full ${c} shadow-[0_0_10px_currentColor]`}
          animate={{ top: ['0%', '92%'], opacity: [0, 1, 1, 0] }}
          transition={{ repeat: Infinity, duration: fast ? 0.6 : 1.6, delay: delay + d * (fast ? 0.6 : 1.6), ease: 'easeIn' }} />
      ))}
      <svg className="absolute -bottom-1 -left-[5px] text-stone-500" width="11" height="7" viewBox="0 0 11 7"><path d="M1 1l4.5 4.5L10 1" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
    </div>
  )
}

function Node({ id, to, tone = 'neutral', icon: Icon, title, sub, metrics = [], onHover, pulseKey, big }) {
  const t = {
    int: 'bg-int-50 border-int-300/70 text-int-900',
    ext: 'bg-ext-50 border-ext-300/70 text-ext-900',
    neutral: 'bg-white border-line text-ink',
  }[tone]
  const subC = { int: 'text-int-700', ext: 'text-ext-700', neutral: 'text-muted' }[tone]
  return (
    <motion.a
      href={`#/${to}`}
      variants={fadeUp}
      onHoverStart={() => onHover(id)}
      onFocus={() => onHover(id)}
      whileHover={{ y: -4, scale: 1.015, boxShadow: '0 18px 40px -18px rgba(0,0,0,.25)' }}
      whileTap={{ scale: 0.98 }}
      transition={spring}
      className={`group relative block rounded-2xl border px-4 text-center ${big ? 'py-5' : 'py-4'} ${t}`}
    >
      <AnimatePresence>
        {pulseKey ? (
          <motion.span key={pulseKey} initial={{ opacity: 0.7, scale: 1 }} animate={{ opacity: 0, scale: 1.08 }} transition={{ duration: 1.1 }} className={`pointer-events-none absolute inset-0 rounded-2xl border-2 ${tone === 'ext' ? 'border-ext-500' : 'border-int-500'}`} />
        ) : null}
      </AnimatePresence>
      <div className="flex items-center justify-center gap-2">
        <Icon className={`size-4 opacity-70 transition-transform group-hover:scale-110 ${subC}`} />
        <h3 className="text-[17px] font-semibold tracking-tight">{title}</h3>
      </div>
      <p className={`mt-0.5 text-sm ${subC}`}>{sub}</p>
      {metrics.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {metrics.map((m) => (
            <span key={m.l} className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${m.alert ? 'bg-red-100 text-red-700' : 'bg-black/5'}`}>
              <AnimatedNumber value={m.v} decimals={m.d || 0} />{m.s} {m.l}
            </span>
          ))}
        </div>
      )}
    </motion.a>
  )
}

export default function Flujo() {
  const { data, pendientes: alerts, pulse, stage } = useStore()
  const [hover, setHover] = useState('nucleo')
  const day = Date.now() - 86400000
  const r24 = data.readings.filter((r) => r.ts > day)
  const intR = data.readings.filter((r) => r.source === 'interna').length
  const extR = data.readings.filter((r) => r.source === 'externa').length
  const logs = data.ingestLog
  // Calidad = aceptados / (recibidos − duplicados): un registro que ya existía no es un error de la fuente.
  const evaluados = logs.reduce((a, l) => a + l.received - (l.duplicates || 0), 0)
  const rate = evaluados ? (logs.reduce((a, l) => a + l.accepted, 0) / evaluados) * 100 : 100
  const vig = data.requirements.filter((q) => !q.expires || q.expires > Date.now()).length
  const comp = (vig / Math.max(1, data.requirements.length)) * 100
  const openF = data.findings.filter((f) => f.status !== 'cerrado').length
  const openC = data.complaints.filter((c) => c.status !== 'cerrada').length
  const exc24 = r24.filter((r) => r.exceed).length
  const recent = Date.now() - pulse.at < 2500
  const pk = (src) => (recent && (!src || pulse.source === src) ? pulse.at : 0)
  const h = (id) => setHover(id)

  return (
    <>
      <PageHeader eyebrow="Visión general" title="Flujo de información ambiental"
        desc="Desde las fuentes internas y externas hasta los tableros y reportes. Cada nodo está vivo: pasa el cursor para entenderlo y haz clic para entrar al módulo." />

      <motion.div variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat i={0} label="Cumplimiento de requisitos" value={comp} suffix="%" icon={ShieldCheck} tone="int" hint={`${vig} de ${data.requirements.length} vigentes`} />
        <Stat i={1} label="Lecturas últimas 24 h" value={r24.length} icon={Wind} hint={`${exc24} fuera de límite`} />
        <Stat i={2} label="Calidad de integración" value={rate} decimals={1} suffix="%" icon={Gauge} hint={`${logs.length} lotes procesados`} />
        <Stat i={3} label="Alertas activas" value={alerts.length} icon={Bell} tone={alerts.length ? 'ext' : 'neutral'} hint={`${openF} hallazgos · ${openC} quejas abiertas`} />
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="grain relative overflow-hidden p-4 md:p-8 lg:col-span-8">
          <motion.div variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }} initial="hidden" animate="show">
            <div className="grid grid-cols-2 gap-3 md:gap-6">
              <Node id="fuentes_int" to="fuentes" tone="int" icon={Factory} title="Fuentes internas" sub="Monitoreos, permisos, auditorías" onHover={h} pulseKey={pk('interna')} metrics={[{ v: intR, l: 'lecturas' }, { v: data.points.length, l: 'puntos' }]} />
              <Node id="fuentes_ext" to="fuentes" tone="ext" icon={Globe} title="Fuentes externas" sub="Autoridad, laboratorios, comunidad" onHover={h} pulseKey={pk('externa')} metrics={[{ v: extR, l: 'lecturas' }, { v: data.stakeholders.length, l: 'actores' }]} />
            </div>
            <div className="grid grid-cols-2"><Arrow tone="int" fast={recent && pulse.source === 'interna'} /><Arrow tone="ext" delay={0.3} fast={recent && pulse.source === 'externa'} /></div>
            <Node id="integracion" to="integracion" icon={Shuffle} title="Integración y validación" sub="APIs, formularios, cargas de laboratorio, sensores" onHover={h} pulseKey={pk()}
              metrics={[{ v: logs.length, l: 'lotes' }, { v: rate, d: 1, s: '%', l: 'aceptado' }, ...(stage >= 0 ? [{ v: stage + 1, s: '/4', l: 'etapa en curso' }] : [])]} />
            <Arrow fast={recent} delay={0.15} />
            <Node big id="nucleo" to="nucleo" icon={Database} title="Núcleo de datos único" sub="Partes interesadas, requisitos, puntos de monitoreo, evidencias" onHover={h}
              metrics={[{ v: data.stakeholders.length, l: 'partes' }, { v: data.requirements.length, l: 'requisitos' }, { v: data.points.length, l: 'puntos' }, { v: data.evidence.length, l: 'evidencias' }]} />
            <div className="hidden grid-cols-4 md:grid">{[0, 1, 2, 3].map((i) => <Arrow key={i} tone={i === 3 ? 'ext' : 'int'} delay={i * 0.2} />)}</div>
            <div className="md:hidden"><Arrow /></div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              <Node id="cumplimiento" to="cumplimiento" tone="int" icon={ShieldCheck} title="Cumplimiento" sub="Permisos, normas" onHover={h} metrics={[{ v: comp, s: '%', l: '' }]} />
              <Node id="monitoreo" to="monitoreo" tone="int" icon={Activity} title="Monitoreo" sub="Agua, aire, ruido" onHover={h} metrics={[{ v: exc24, l: 'excesos', alert: exc24 > 0 }]} />
              <Node id="hallazgos" to="hallazgos" tone="int" icon={TriangleAlert} title="Hallazgos" sub="No conformidades" onHover={h} metrics={[{ v: openF, l: 'abiertos', alert: openF > 0 }]} />
              <Node id="relaciones" to="relaciones" tone="ext" icon={Users} title="Relaciones" sub="Quejas, comunidad" onHover={h} metrics={[{ v: openC, l: 'quejas' }]} />
            </div>
            <Arrow delay={0.4} />
            <div className="grid grid-cols-2 gap-3 md:gap-6">
              <Node id="tableros" to="tableros" icon={LayoutDashboard} title="Tableros y alertas" sub="Límites, vencimientos" onHover={h} metrics={[{ v: alerts.length, l: 'alertas', alert: alerts.length > 0 }]} />
              <Node id="reportes" to="reportes" tone="ext" icon={FileText} title="Reportes y portal" sub="Autoridad y partes externas" onHover={h} metrics={[{ v: data.requirements.filter((q) => q.kind === 'permiso').length, l: 'informes' }]} />
            </div>
          </motion.div>
        </Card>

        <div className="flex flex-col gap-6 lg:col-span-4">
          <Card className="p-5">
            <p className="flex items-center gap-1.5 text-xs font-semibold tracking-[.14em] text-muted uppercase"><Sparkles className="size-3.5" />Etapa seleccionada</p>
            <AnimatePresence mode="wait">
              <motion.p key={hover} initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }} transition={{ duration: 0.25 }} className="mt-3 text-[15px] leading-relaxed">
                {DESC[hover]}
              </motion.p>
            </AnimatePresence>
          </Card>
          <Card className="flex-1 p-5">
            <p className="mb-3 text-xs font-semibold tracking-[.14em] text-muted uppercase">Actividad del núcleo</p>
            <motion.ul layout className="space-y-2.5">
              <AnimatePresence initial={false}>
                {data.activity.slice(0, 9).map((a) => (
                  <motion.li key={a.id} layout initial={{ opacity: 0, x: -16, height: 0 }} animate={{ opacity: 1, x: 0, height: 'auto' }} exit={{ opacity: 0 }} transition={spring} className="flex gap-2.5 text-sm">
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ${{ int: 'bg-int-500', ext: 'bg-ext-500', danger: 'bg-danger' }[a.tone] || 'bg-stone-400'}`} />
                    <span className="flex-1">{a.text}<span className="ml-1.5 text-xs text-muted">{ago(a.ts)}</span></span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          </Card>
        </div>
      </div>
    </>
  )
}
