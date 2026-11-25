import { useEffect, useRef } from 'react'
import { AnimatePresence, animate, motion } from 'motion/react'
import { X } from 'lucide-react'

export const spring = { type: 'spring', stiffness: 380, damping: 32 }
export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] } }),
}
export const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }

const TONES = {
  int: 'bg-int-50 text-int-700 border-int-300/60',
  ext: 'bg-ext-50 text-ext-700 border-ext-300/60',
  neutral: 'bg-white text-ink border-line',
  warn: 'bg-amber-50 text-amber-800 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  ok: 'bg-int-50 text-int-700 border-int-100',
  muted: 'bg-stone-100 text-muted border-stone-200',
}

export function Card({ className = '', tone = 'neutral', children, hover, ...p }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={hover ? { y: -3, boxShadow: '0 12px 30px -12px rgba(0,0,0,.18)' } : undefined}
      transition={spring}
      className={`rounded-2xl border ${TONES[tone]} ${className}`}
      {...p}
    >
      {children}
    </motion.div>
  )
}

export function Badge({ tone = 'muted', children, dot, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${TONES[tone]} ${className}`}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export function Button({ variant = 'primary', icon: Icon, children, className = '', loading, ...p }) {
  const v = {
    primary: 'bg-int-700 text-white hover:bg-int-900',
    ext: 'bg-ext-700 text-white hover:bg-ext-900',
    ghost: 'bg-white text-ink border border-line hover:bg-stone-50',
    subtle: 'text-muted hover:text-ink hover:bg-stone-100',
    danger: 'text-red-700 hover:bg-red-50',
  }[variant]
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      transition={spring}
      disabled={loading || p.disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${v} ${className}`}
      {...p}
    >
      {Icon && <Icon className={`size-4 ${loading ? 'animate-spin' : ''}`} />}
      {children}
    </motion.button>
  )
}

export function PageHeader({ eyebrow, title, desc, actions, tone = 'neutral' }) {
  const c = { int: 'text-int-700', ext: 'text-ext-700', neutral: 'text-muted' }[tone]
  return (
    <motion.div variants={fadeUp} className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className={`mb-1 text-xs font-semibold tracking-[.14em] uppercase ${c}`}>{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
        {desc && <p className="mt-1.5 max-w-2xl text-sm text-muted">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </motion.div>
  )
}

export function AnimatedNumber({ value = 0, decimals = 0, className = '' }) {
  const ref = useRef(null)
  const prev = useRef(0)
  useEffect(() => {
    const ctrl = animate(prev.current, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => { if (ref.current) ref.current.textContent = v.toLocaleString('es', { maximumFractionDigits: decimals, minimumFractionDigits: decimals }) },
    })
    prev.current = value
    return () => ctrl.stop()
  }, [value, decimals])
  return <span ref={ref} className={`tabular-nums ${className}`}>0</span>
}

export function Stat({ label, value, suffix, decimals, icon: Icon, tone = 'neutral', hint, i = 0 }) {
  return (
    <Card tone={tone} hover className="p-4" custom={i}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium opacity-80">{label}</p>
        {Icon && <Icon className="size-4 opacity-60" />}
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight">
        <AnimatedNumber value={value} decimals={decimals} />
        {suffix && <span className="ml-1 text-base font-medium opacity-60">{suffix}</span>}
      </p>
      {hint && <p className="mt-1 text-xs opacity-70">{hint}</p>}
    </Card>
  )
}

export function Modal({ open, onClose, title, children, wide }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={spring}
            className={`relative max-h-[90vh] w-full overflow-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl scroll-thin ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{title}</h3>
              <button onClick={onClose} className="rounded-full p-1.5 text-muted hover:bg-stone-100" aria-label="Cerrar"><X className="size-4" /></button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  )
}
export const inputCls = 'w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-int-500 focus:ring-4 focus:ring-int-50'

export function Tabs({ tabs, value, onChange, id = 'tabs' }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-line bg-white p-1">
      {tabs.map((t) => (
        <button key={t.value} onClick={() => onChange(t.value)} className={`relative rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${value === t.value ? 'text-white' : 'text-muted hover:text-ink'}`}>
          {value === t.value && <motion.span layoutId={`${id}-pill`} transition={spring} className="absolute inset-0 rounded-xl bg-ink" />}
          <span className="relative flex items-center gap-1.5">{t.label}{t.count != null && <span className="text-xs opacity-60">{t.count}</span>}</span>
        </button>
      ))}
    </div>
  )
}

export function Empty({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted">
      {Icon && <Icon className="size-6 opacity-50" />}
      {text}
    </div>
  )
}

export const SEV = { alta: 'danger', media: 'warn', baja: 'muted' }
