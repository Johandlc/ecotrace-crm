import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { Bar, BarChart, Cell, CartesianGrid, Line, LineChart, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, Area, AreaChart, Legend } from 'recharts'
import { Card } from './ui'
import { FuenteBtn } from './Fuentes'
import { SECTORES, SECTOR_CT_LABEL, sectorDeCT } from '../data/quito'
import { PARAMS, fmt, fmtT } from '../lib/params'

const ESTACION_COLORES = ['#0f6b4f', '#c4643f', '#2563a8', '#7c5cbf', '#b42318', '#8a6d1f', '#3b8ea5', '#d08b2c', '#6b6a66']
const tip = { borderRadius: 12, border: '1px solid #e4e2dc', fontSize: 12 }
const ax = { fontSize: 11, fill: '#6b6a66' }

function Bloque({ titulo, pregunta, fuentes, contexto, children, className = '', i = 0 }) {
  return (
    <Card custom={i} className={`p-5 ${className}`} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[.12em] text-muted uppercase">{pregunta}</p>
          <h3 className="mt-0.5 font-semibold">{titulo}</h3>
        </div>
        <FuenteBtn ids={fuentes} contexto={contexto} />
      </div>
      {children}
    </Card>
  )
}

export default function EstadisticasQuito({ d }) {
  const { remmaq, ct, pacq } = d
  const [hl, setHl] = useState(null)
  const est = remmaq.stations

  // 1 · Tendencia anual PM2.5 (años con ≥ 75 % de días válidos)
  const anual = useMemo(() => {
    const years = Array.from({ length: 2025 - 2012 + 1 }, (_, i) => String(2012 + i))
    return years.map((y) => ({ y, ...Object.fromEntries(est.map((s) => { const a = remmaq.annual.pm2_5[s.id]?.[y]; return [s.id, a && a.days >= 274 ? a.mean : null] })) }))
  }, [remmaq, est])

  // 2 · Días del último año sobre guía OMS y sobre la NCAA (PM2.5 24 h)
  const dias = est.map((s) => {
    const dd = remmaq.daily.pm2_5[s.id] || []
    return { name: s.name, oms: dd.filter((x) => x[1] > PARAMS.pm2_5.who).length, ncaa: dd.filter((x) => x[1] > PARAMS.pm2_5.max).length, total: dd.length }
  }).sort((a, b) => b.oms - a.oms)

  // 3 · Ciclo diario promedio (hora local) en la serie horaria publicada más reciente
  const ciclo = useMemo(() => {
    const { start, step, series } = remmaq.hourly
    const acc = Array.from({ length: 24 }, (_, h) => ({ h, pm: [], no2: [] }))
    const push = (k, key) => Object.values(series[k] || {}).forEach((arr) => arr.forEach((v, i) => { if (v != null) { const h = new Date(start + i * step - 5 * 3600000).getUTCHours(); acc[h][key].push(v) } }))
    push('pm2_5', 'pm'); push('no2', 'no2')
    const m = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null)
    return acc.map((x) => ({ h: `${String(x.h).padStart(2, '0')}h`, pm: m(x.pm), no2: m(x.no2) }))
  }, [remmaq])

  // 4 · Inventario PACQ
  const pacqData = pacq.sectores.map((s, i) => ({ ...s, t: (pacq.total * s.pct) / 100, c: ['#c4643f', '#d08b2c', '#5d8a3a', '#8a6d1f'][i] }))

  // 5 · Climate TRACE 2024: totales del DMQ + instalaciones
  const ctSect = useMemo(() => {
    const m = {}
    ct.assets.filter((a) => (a.emissions.co2e_100yr ?? 0) > 0 && a.sector !== 'removals').forEach((a) => {
      const label = a.aggregate ? SECTOR_CT_LABEL[a.sector] || a.sector : `${SECTORES[sectorDeCT(a.sector)]?.label} (instalaciones)`
      m[label] = { label, t: (m[label]?.t || 0) + a.emissions.co2e_100yr, c: SECTORES[sectorDeCT(a.sector)]?.color }
    })
    return Object.values(m).sort((a, b) => b.t - a.t).slice(0, 8)
  }, [ct])
  const absorciones = ct.assets.find((a) => a.sector === 'removals')?.emissions.co2e_100yr

  return (
    <section className="mt-10">
      <div className="mb-5">
        <p className="text-xs font-semibold tracking-[.14em] text-ext-700 uppercase">Estadísticas</p>
        <h2 className="text-2xl font-semibold tracking-tight">Lo que dicen los datos</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted">Cada gráfico usa datos oficiales o estimaciones públicas. Toca «Fuente» para ver el origen, el método y sus limitaciones.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Bloque i={0} pregunta="¿Mejora o empeora el aire?" titulo="PM2.5 promedio anual por estación (µg/m³)" fuentes={['remmaq', 'ncaa', 'oms']} contexto="Sólo años con al menos 75 % de días válidos. Línea roja: norma anual NCAA (15). Línea verde: guía anual OMS (5).">
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={anual} margin={{ left: -18, right: 8 }} onMouseLeave={() => setHl(null)}>
                <CartesianGrid stroke="#eeece6" vertical={false} />
                <XAxis dataKey="y" tick={ax} axisLine={false} tickLine={false} /><YAxis tick={ax} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                <Tooltip contentStyle={tip} formatter={(v, k) => [`${fmt(v, 1)} µg/m³`, est.find((s) => s.id === k)?.name]} />
                <ReferenceLine y={15} stroke="#b42318" strokeDasharray="5 4" label={{ value: 'NCAA 15', fontSize: 10, fill: '#b42318', position: 'insideTopLeft' }} />
                <ReferenceLine y={5} stroke="#2a8f6a" strokeDasharray="5 4" label={{ value: 'OMS 5', fontSize: 10, fill: '#2a8f6a', position: 'insideBottomLeft' }} />
                {est.map((s, i) => <Line key={s.id} dataKey={s.id} name={s.name} stroke={ESTACION_COLORES[i]} strokeWidth={hl === s.id ? 3 : 1.6} strokeOpacity={hl && hl !== s.id ? 0.2 : 1} dot={false} connectNulls onMouseEnter={() => setHl(s.id)} animationDuration={1200} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">{est.map((s, i) => <button key={s.id} onMouseEnter={() => setHl(s.id)} onMouseLeave={() => setHl(null)} className="flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[11px]"><span className="size-2 rounded-full" style={{ background: ESTACION_COLORES[i] }} />{s.name}</button>)}</div>
        </Bloque>

        <Bloque i={1} pregunta="¿Cuántos días se respira aire fuera de la guía?" titulo="Días con PM2.5 24 h sobre la guía OMS — último año" fuentes={['remmaq', 'oms', 'ncaa']} contexto="Promedios diarios con al menos 18 horas válidas. Guía OMS 24 h = 15 µg/m³; norma NCAA 24 h = 50 µg/m³.">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={dias} layout="vertical" margin={{ left: 10, right: 16 }}>
                <XAxis type="number" tick={ax} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="name" tick={ax} width={80} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tip} cursor={{ fill: '#f2f0ea' }} formatter={(v, k, p) => [`${v} de ${p.payload.total} días`, k === 'oms' ? 'Sobre guía OMS' : 'Sobre norma NCAA']} />
                <Bar dataKey="oms" fill="#e08a3a" radius={[0, 6, 6, 0]} animationDuration={1100} />
                <Bar dataKey="ncaa" fill="#b42318" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted">Naranja: días sobre la guía de salud de la OMS · Rojo: días sobre el límite legal ecuatoriano.</p>
        </Bloque>

        <Bloque i={2} pregunta="¿A qué hora empeora?" titulo="Ciclo diario promedio — PM2.5 y NO₂ (µg/m³)" fuentes={['remmaq']} contexto={`Promedio por hora local de todas las estaciones, ${new Date(remmaq.hourly.start).toLocaleDateString('es', { day: 'numeric', month: 'long' })} – ${new Date(remmaq.meta.lastTs - 3600000).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })} (${Math.round(remmaq.hourly.n / 24)} días).`}>
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={ciclo} margin={{ left: -18, right: 8 }}>
                <defs>
                  <linearGradient id="gpm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c4643f" stopOpacity={0.4} /><stop offset="1" stopColor="#c4643f" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gno" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2563a8" stopOpacity={0.3} /><stop offset="1" stopColor="#2563a8" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid stroke="#eeece6" vertical={false} />
                <XAxis dataKey="h" tick={ax} axisLine={false} tickLine={false} interval={2} /><YAxis tick={ax} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tip} formatter={(v, k) => [`${fmt(v, 1)} µg/m³`, k === 'pm' ? 'PM2.5' : 'NO₂']} />
                <Legend formatter={(v) => (v === 'pm' ? 'PM2.5' : 'NO₂')} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="no2" stroke="#2563a8" fill="url(#gno)" strokeWidth={2} animationDuration={1200} />
                <Area type="monotone" dataKey="pm" stroke="#c4643f" fill="url(#gpm)" strokeWidth={2} animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted">Los picos de la mañana coinciden con la hora punta del tráfico.</p>
        </Bloque>

        <Bloque i={3} pregunta="¿Quién emite los gases de efecto invernadero?" titulo={`Inventario oficial de GEI del DMQ (${pacq.anio}) · ${fmtT(pacq.total)} CO₂e`} fuentes={['pacq']} contexto="Plan de Acción Climática de Quito 2020, pp. 38-39. Las toneladas por sector son el total publicado × el porcentaje publicado.">
          <div className="flex flex-col items-center gap-4 sm:flex-row lg:flex-col xl:flex-row">
            <div className="relative h-52 w-52 shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pacqData} dataKey="pct" innerRadius={58} outerRadius={92} paddingAngle={2} stroke="none" animationDuration={1200}>{pacqData.map((s) => <Cell key={s.id} fill={s.c} />)}</Pie>
                  <Tooltip contentStyle={tip} formatter={(v, k, p) => [`${v} % · ${fmtT(p.payload.t)}`, p.payload.label]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><p className="text-xl font-semibold">7,61</p><p className="text-[10px] text-muted">Mt CO₂e</p></div></div>
            </div>
            <ul className="w-full space-y-2 text-sm">
              {pacqData.map((s, i) => (
                <motion.li key={s.id} initial={{ opacity: 0, x: 10 }} whileInView={{ opacity: 1, x: 0, transition: { delay: i * 0.08 } }} viewport={{ once: true }} className="flex items-start gap-2">
                  <span className="mt-1 size-2.5 shrink-0 rounded-sm" style={{ background: s.c }} /><span className="flex-1">{s.label.split(' (')[0]}{s.label.includes(' (') && <span className="block text-[11px] text-muted">{s.label.slice(s.label.indexOf(' (') + 2, -1)}</span>}</span><b className="shrink-0 tabular-nums">{s.pct} % <span className="block text-right text-[11px] font-normal text-muted">{fmtT(s.t)}</span></b>
                </motion.li>
              ))}
              <li className="pt-1 text-xs text-muted">{pacq.proyeccion}</li>
            </ul>
          </div>
        </Bloque>

        <Bloque i={4} className="lg:col-span-2" pregunta="¿Y hoy? Estimación independiente" titulo="Emisiones estimadas en el DMQ por fuente — 2024 (t CO₂e/año)" fuentes={['climatetrace']} contexto={`Climate TRACE estima por separado los totales del DMQ (tráfico, edificios, uso del suelo) y las instalaciones identificadas. Absorciones de vegetación: −${fmtT(absorciones)} (no graficadas).`}>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={ctSect} layout="vertical" margin={{ left: 30, right: 30 }}>
                <XAxis type="number" tick={ax} axisLine={false} tickLine={false} tickFormatter={(v) => fmtT(v)} /><YAxis type="category" dataKey="label" tick={ax} width={210} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tip} cursor={{ fill: '#f2f0ea' }} formatter={(v) => [`${fmtT(v)} CO₂e`, '2024']} />
                <Bar dataKey="t" radius={[0, 6, 6, 0]} animationDuration={1200}>{ctSect.map((s) => <Cell key={s.label} fill={s.c || '#888'} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted">El transporte por carretera vuelve a ser la mayor fuente, igual que en el inventario oficial de 2015.</p>
        </Bloque>
      </div>
    </section>
  )
}
