// Administración de usuarios y roles (sólo ADMIN en modo API).
// Vista pura: lee y modifica a través de api.usuarios (api/internal.js → /api/v1/usuarios).
import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { UserPlus, Lock, Unlock, ShieldCheck, Eye, KeyRound, Power, Search } from 'lucide-react'
import { useStore } from '../store'
import { Badge, Button, Card, Field, Modal, PageHeader, Stat, inputCls, spring } from '../components/ui'
import { ago } from '../lib/params'

const ROLES = {
  ADMIN: { label: 'Administrador', tone: 'muted', icon: ShieldCheck, desc: 'Todo, incluida la gestión de usuarios' },
  ANALISTA: { label: 'Analista', tone: 'int', icon: KeyRound, desc: 'Registra y modifica información ambiental' },
  LECTOR: { label: 'Lector', tone: 'ext', icon: Eye, desc: 'Sólo consulta' },
}
const VACIO = { username: '', nombre: '', correo: '', rol: 'ANALISTA', password: '' }

export default function Usuarios() {
  const { api, sesion, toast } = useStore()
  const [lista, setLista] = useState(null)
  const [q, setQ] = useState('')
  const [nuevo, setNuevo] = useState(false)
  const [form, setForm] = useState(VACIO)
  const [errores, setErrores] = useState({})
  const [clave, setClave] = useState(null) // { id, username, password }

  const cargar = useCallback(() => api.usuarios.listar().then(setLista).catch((e) => toast(e.message, 'danger')), [api, toast])
  useEffect(() => { cargar() }, [cargar])

  const accion = async (fn, msg) => {
    try { await fn(); if (msg) toast(msg); await cargar() } catch (e) { toast(e.message, 'danger') }
  }
  const crear = async (e) => {
    e.preventDefault()
    setErrores({})
    try {
      await api.usuarios.crear({ ...form, correo: form.correo || null })
      toast(`Usuario ${form.username} creado`)
      setNuevo(false); setForm(VACIO); cargar()
    } catch (err) {
      if (err.status === 400 && err.data) setErrores(err.data)
      else toast(err.message, 'danger')
    }
  }

  const filtrados = (lista || []).filter((u) => `${u.username} ${u.nombre} ${u.correo ?? ''}`.toLowerCase().includes(q.toLowerCase()))
  const th = 'py-2.5 px-3 text-left text-[11px] font-semibold tracking-wider text-muted uppercase'
  return (
    <>
      <PageHeader eyebrow="Administración" title="Usuarios y roles" desc="Quién puede entrar a EcoTrace y qué puede hacer. Las contraseñas se guardan cifradas con BCrypt y las cuentas se bloquean tras 5 intentos fallidos."
        actions={<Button icon={UserPlus} onClick={() => setNuevo(true)}>Nuevo usuario</Button>} />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat i={0} label="Usuarios activos" value={(lista || []).filter((u) => u.activo).length} tone="int" />
        <Stat i={1} label="Administradores" value={(lista || []).filter((u) => u.rol === 'ADMIN' && u.activo).length} />
        <Stat i={2} label="Bloqueados" value={(lista || []).filter((u) => u.bloqueado).length} tone={(lista || []).some((u) => u.bloqueado) ? 'warn' : 'neutral'} />
        <Stat i={3} label="Desactivados" value={(lista || []).filter((u) => !u.activo).length} />
      </div>
      <div className="mb-3 flex justify-end"><div className="relative w-full md:w-72"><Search className="absolute top-2.5 left-3 size-4 text-muted" /><input className={`${inputCls} pl-9`} placeholder="Buscar usuario…" value={q} onChange={(e) => setQ(e.target.value)} /></div></div>
      <Card className="overflow-x-auto scroll-thin">
        <table className="w-full min-w-[760px]">
          <thead className="border-b border-line bg-stone-50/60"><tr><th className={th}>Usuario</th><th className={th}>Rol</th><th className={th}>Estado</th><th className={th}>Último acceso</th><th className={th} /></tr></thead>
          <tbody>
            <AnimatePresence initial={false}>
              {filtrados.map((u, i) => {
                const yo = u.username === sesion?.username
                return (
                  <motion.tr key={u.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: u.activo ? 1 : 0.55, y: 0, transition: { delay: i * 0.03 } }} exit={{ opacity: 0 }} transition={spring} className="border-b border-line last:border-0">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-xl bg-int-700 text-xs font-bold text-white">{u.iniciales}</span>
                        <div><p className="text-sm font-medium">{u.nombre} {yo && <Badge tone="int">tú</Badge>}</p><p className="text-xs text-muted">@{u.username}{u.correo ? ` · ${u.correo}` : ''}</p></div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <select disabled={yo} value={u.rol} onChange={(e) => accion(() => api.usuarios.actualizar(u.id, { rol: e.target.value }), `Rol de ${u.username}: ${ROLES[e.target.value].label}`)}
                        className="rounded-lg border border-line bg-white px-2 py-1 text-sm disabled:opacity-60" title={yo ? 'No puedes cambiar tu propio rol' : ROLES[u.rol].desc}>
                        {Object.entries(ROLES).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-3">
                      {!u.activo ? <Badge tone="muted">Desactivado</Badge> : u.bloqueado ? <Badge tone="danger" dot>Bloqueado</Badge> : <Badge tone="ok" dot>Activo</Badge>}
                      {u.intentosFallidos > 0 && !u.bloqueado && <span className="ml-2 text-[11px] text-amber-700">{u.intentosFallidos} intento(s) fallido(s)</span>}
                    </td>
                    <td className="px-3 py-3 text-sm text-muted">{u.ultimoAcceso ? ago(u.ultimoAcceso) : 'Nunca'}</td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end gap-1">
                        {u.bloqueado && <button onClick={() => accion(() => api.usuarios.desbloquear(u.id), `${u.username} desbloqueado`)} className="rounded-lg p-1.5 text-int-700 hover:bg-int-50" title="Desbloquear"><Unlock className="size-4" /></button>}
                        <button onClick={() => setClave({ id: u.id, username: u.username, password: '' })} className="rounded-lg p-1.5 text-muted hover:bg-stone-100 hover:text-ink" title="Restablecer contraseña"><Lock className="size-4" /></button>
                        {!yo && <button onClick={() => accion(() => (u.activo ? api.usuarios.desactivar(u.id) : api.usuarios.actualizar(u.id, { activo: true })), u.activo ? `${u.username} desactivado` : `${u.username} reactivado`)}
                          className={`rounded-lg p-1.5 ${u.activo ? 'text-red-700 hover:bg-red-50' : 'text-int-700 hover:bg-int-50'}`} title={u.activo ? 'Desactivar' : 'Reactivar'}><Power className="size-4" /></button>}
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>
        {!lista && <p className="p-6 text-sm text-muted">Cargando usuarios…</p>}
      </Card>

      <Modal open={nuevo} onClose={() => setNuevo(false)} title="Nuevo usuario">
        <form onSubmit={crear} className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Usuario"><input required className={inputCls} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
            <Field label="Rol"><select className={inputCls} value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>{Object.entries(ROLES).map(([k, r]) => <option key={k} value={k}>{r.label}</option>)}</select></Field>
          </div>
          {errores.username && <p className="-mt-2 text-xs text-danger">{errores.username}</p>}
          <Field label="Nombre completo"><input required className={inputCls} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Field>
          <Field label="Correo (opcional)"><input type="email" className={inputCls} value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} /></Field>
          <Field label="Contraseña inicial (8+ caracteres, letra y número)"><input required type="password" autoComplete="new-password" className={inputCls} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
          {errores.password && <p className="-mt-2 text-xs text-danger">{errores.password}</p>}
          <p className="rounded-xl bg-stone-50 px-3 py-2 text-xs text-muted">{ROLES[form.rol].desc}</p>
          <Button className="mt-1">Crear usuario</Button>
        </form>
      </Modal>

      <Modal open={!!clave} onClose={() => setClave(null)} title={`Restablecer contraseña de @${clave?.username}`}>
        <form onSubmit={(e) => { e.preventDefault(); accion(() => api.usuarios.actualizar(clave.id, { password: clave.password }), 'Contraseña restablecida').then(() => setClave(null)) }} className="grid gap-3">
          <Field label="Nueva contraseña"><input required minLength={8} type="password" autoComplete="new-password" className={inputCls} value={clave?.password || ''} onChange={(e) => setClave({ ...clave, password: e.target.value })} /></Field>
          <Button>Guardar</Button>
        </form>
      </Modal>
    </>
  )
}
