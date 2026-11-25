// Modo local (sin backend): misma interfaz que la API Spring Boot, persistida en localStorage.
import { db, persist, uid, resetDb, prepararDb } from './db'

const PREFIX = { points: 'P', stakeholders: 'S', requirements: 'Q', findings: 'H', complaints: 'C', evidence: 'E', readings: 'R', ingestLog: 'I', activity: 'A' }
const wait = (ms = 120 + Math.random() * 180) => new Promise((r) => setTimeout(r, ms))
const clone = (x) => structuredClone(x)

export const localApi = {
  async snapshot() {
    await wait(200)
    return clone(await prepararDb())
  },
  async list(col, filter) {
    await wait()
    const rows = db()[col] || []
    return clone(filter ? rows.filter(filter) : rows)
  },
  async create(col, data) {
    await wait()
    const row = { id: uid(PREFIX[col] || 'X'), createdAt: Date.now(), ...data }
    db()[col].unshift(row)
    persist()
    return clone(row)
  },
  async insertMany(col, rows) {
    await wait(80)
    db()[col].push(...rows)
    persist()
    return rows.length
  },
  async update(col, id, patch) {
    await wait()
    const row = db()[col].find((r) => r.id === id)
    if (!row) throw new Error(`${col}/${id} no existe`)
    Object.assign(row, patch, { updatedAt: Date.now() })
    persist()
    return clone(row)
  },
  async remove(col, id) {
    await wait()
    const d = db()
    d[col] = d[col].filter((r) => r.id !== id)
    persist()
    return true
  },
  async log(text, tone = 'neutral') {
    db().activity.unshift({ id: uid('A'), ts: Date.now(), text, tone })
    persist()
  },
  async reset() {
    await wait(300)
    resetDb()
  },
}
