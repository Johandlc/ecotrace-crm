import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Card, PageHeader, Tabs, fadeUp } from '../components/ui'
import { FichaFuente, TIPO_FUENTE, useFuentes } from '../components/Fuentes'

export default function FuentesDatos() {
  const { cargar } = useFuentes()
  const [cat, setCat] = useState(null)
  const [tipo, setTipo] = useState('todas')
  useEffect(() => { cargar().then(setCat) }, [cargar])
  const lista = (cat || []).filter((f) => tipo === 'todas' || f.tipo === tipo)
  const tipos = [...new Set((cat || []).map((f) => f.tipo))]
  return (
    <>
      <PageHeader eyebrow="Transparencia" title="Fuentes de información"
        desc="De dónde sale cada dato de EcoTrace: qué es medición oficial, qué es estimación o modelo, qué es norma y qué es demostración. El mismo catálogo se muestra al tocar «Fuente» en cualquier gráfico." />
      <div className="mb-5"><Tabs id="tipo-fuente" value={tipo} onChange={setTipo} tabs={[{ value: 'todas', label: 'Todas', count: cat?.length }, ...tipos.map((t) => ({ value: t, label: TIPO_FUENTE[t]?.[1] || t, count: cat.filter((f) => f.tipo === t).length }))]} /></div>
      <motion.div key={tipo} initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid gap-4 md:grid-cols-2">
        {lista.map((f, i) => <Card key={f.id} custom={i} variants={fadeUp} hover className="p-5"><FichaFuente f={f} /></Card>)}
      </motion.div>
      {!cat && <p className="text-sm text-muted">Cargando catálogo…</p>}
    </>
  )
}
