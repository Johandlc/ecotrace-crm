// Datasets reales de referencia (src/main/resources/datos). Modo API: GET /api/territorio/datos/{nombre}.
// Modo local: import dinámico del mismo archivo (se empaqueta como chunk aparte, sólo se carga si se usa).
import { http } from './http'

const LOCAL = import.meta.glob('../../../src/main/resources/datos/*.json', { import: 'default' })
const cache = new Map()

export function cargarDataset(nombre, remoto) {
  const key = `${remoto ? 'api' : 'local'}:${nombre}`
  if (!cache.has(key)) {
    const p = remoto
      ? http.get(`/territorio/datos/${nombre}`)
      : LOCAL[`../../../src/main/resources/datos/${nombre}.json`]?.() ?? Promise.reject(new Error(`Dataset ${nombre} no encontrado`))
    cache.set(key, p.catch((e) => { cache.delete(key); throw e }))
  }
  return cache.get(key)
}
