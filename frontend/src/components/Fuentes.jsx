import { createContext, useCallback, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BookOpen, ExternalLink, X, Info } from 'lucide-react'
import { useStore } from '../store'
import { Badge, spring } from './ui'

const Ctx = createContext(null)
export const useFuentes = () => useContext(Ctx)

export const TIPO_FUENTE = {
  real: ['ok', 'Dato real'], oficial: ['ok', 'Dato oficial'], modelo: ['int', 'Modelo'], referencia: ['muted', 'Referencia'],
  norma: ['muted', 'Norma'], simulado: ['warn', 'Demo / simulado'],
}

/** Ficha de una fuente: qué es, cómo se usa, limitaciones y enlace. Reutilizada por el panel y por la página de fuentes. */
export function FichaFuente({ f, contexto }) {
  const [tone, label] = TIPO_FUENTE[f.tipo] || ['muted', f.tipo]
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2"><Badge tone={tone}>{label}</Badge>{f.periodo && <Badge>{f.periodo}</Badge>}</div>
      <h3 className="mt-2 text-lg leading-snug font-semibold">{f.nombre}</h3>
      <p className="text-sm text-muted">{f.institucion} · {f.licencia}</p>
      {contexto && <p className="mt-3 rounded-xl bg-int-50 px-3 py-2 text-sm text-int-900"><Info className="mr-1 inline size-3.5" />{contexto}</p>}
      <dl className="mt-4 space-y-3 text-sm">
        <div><dt className="text-xs font-semibold tracking-wide text-muted uppercase">Qué aporta</dt><dd className="mt-0.5">{f.que}</dd></div>
        <div><dt className="text-xs font-semibold tracking-wide text-muted uppercase">Dónde se usa</dt><dd className="mt-0.5">{f.uso}</dd></div>
        <div><dt className="text-xs font-semibold tracking-wide text-muted uppercase">Cómo llega a la app</dt><dd className="mt-0.5 font-mono text-xs">{f.como}</dd></div>
        {f.limitaciones && <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900"><b>Limitaciones:</b> {f.limitaciones}</div>}
      </dl>
      {f.url && <a href={f.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium break-all text-int-700 hover:underline">{f.url.replace(/^https?:\/\//, '')}<ExternalLink className="size-3.5 shrink-0" /></a>}
    </div>
  )
}

export function FuentesProvider({ children }) {
  const { api, mode } = useStore()
  const [catalogo, setCatalogo] = useState(null)
  const [abierto, setAbierto] = useState(null) // { ids, contexto }

  const cargar = useCallback(async () => {
    if (catalogo) return catalogo
    const c = await api.dataset('fuentes-informacion')
    setCatalogo(c)
    return c
  }, [api, catalogo])

  const abrir = useCallback((ids, contexto) => {
    cargar()
    setAbierto({ ids: [].concat(ids), contexto })
  }, [cargar])

  const fuentes = (catalogo || []).filter((f) => abierto?.ids.includes(f.id))
  return (
    <Ctx.Provider value={{ abrir, cargar, catalogo, mode }}>
      {children}
      <AnimatePresence>
        {abierto && (
          <motion.div className="fixed inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]" onClick={() => setAbierto(null)} />
            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={spring}
              className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <p className="flex items-center gap-2 text-sm font-semibold"><BookOpen className="size-4" />De dónde sale este dato</p>
                <button onClick={() => setAbierto(null)} className="rounded-full p-1.5 text-muted hover:bg-stone-100" aria-label="Cerrar"><X className="size-4" /></button>
              </div>
              <div className="flex-1 space-y-6 overflow-y-auto p-5 scroll-thin">
                {!catalogo && <p className="text-sm text-muted">Cargando…</p>}
                {fuentes.map((f, i) => (
                  <motion.div key={f.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.08 + i * 0.06 } }} className={i ? 'border-t border-line pt-6' : ''}>
                    <FichaFuente f={f} contexto={i === 0 ? abierto.contexto : null} />
                  </motion.div>
                ))}
              </div>
              <a href="#/datos" onClick={() => setAbierto(null)} className="border-t border-line px-5 py-3 text-sm font-medium text-int-700 hover:bg-stone-50">Ver todas las fuentes de información →</a>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  )
}

/** Botón discreto: el detalle de la fuente sólo aparece cuando el usuario lo pide. */
export function FuenteBtn({ ids, contexto, className = '', dark }) {
  const f = useFuentes()
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); f.abrir(ids, contexto) }} title="Ver fuente"
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase transition ${dark ? 'text-white/70 hover:bg-white/15 hover:text-white' : 'text-muted hover:bg-stone-100 hover:text-ink'} ${className}`}>
      <Info className="size-3" />Fuente
    </button>
  )
}
