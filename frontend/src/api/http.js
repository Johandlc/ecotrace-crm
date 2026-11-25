// Cliente HTTP de la API interna (Spring Boot, /api/v1).
//  · Envía la cookie de sesión (credentials: 'include').
//  · Protección CSRF: en peticiones que modifican datos lee la cookie XSRF-TOKEN y la reenvía en
//    la cabecera X-XSRF-TOKEN (si aún no existe, la pide a /auth/csrf).
//  · Desenvuelve ApiResponse { success, message, data } y lanza ApiError con status y detalle.
//  · Un 401 fuera de /auth avisa a la app (sesión expirada) mediante onNoAutorizado.
const BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data
  }
}

let onNoAutorizado = () => {}
export const alPerderSesion = (fn) => { onNoAutorizado = fn }

const leerCookie = (nombre) => document.cookie.split('; ').find((c) => c.startsWith(`${nombre}=`))?.split('=')[1]

async function tokenCsrf() {
  let t = leerCookie('XSRF-TOKEN')
  if (!t) {
    await fetch(`${BASE}/auth/csrf`, { credentials: 'include' })
    t = leerCookie('XSRF-TOKEN')
  }
  return t ? decodeURIComponent(t) : null
}

async function request(method, path, body) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (method !== 'GET') {
    const t = await tokenCsrf()
    if (t) headers['X-XSRF-TOKEN'] = t
  }
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, credentials: 'include' })
  let json = null
  try { json = await res.json() } catch { /* 204 sin cuerpo */ }
  if (!res.ok || json?.success === false) {
    if (res.status === 401 && !path.startsWith('/auth/')) onNoAutorizado()
    const campos = res.status === 400 && json?.data && typeof json.data === 'object'
      ? ` (${Object.entries(json.data).map(([k, v]) => `${k}: ${v}`).join(', ')})` : ''
    throw new ApiError((json?.message || `HTTP ${res.status}`) + campos, res.status, json?.data)
  }
  return json?.data
}

export const http = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b ?? {}),
  patch: (p, b) => request('PATCH', p, b),
  del: (p) => request('DELETE', p),
}

/** Comprueba si el backend responde; devuelve la portada pública del login o null. */
export async function detectBackend(timeout = 2500) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeout)
  try {
    const res = await fetch(`${BASE}/auth/portada`, { signal: ctrl.signal, credentials: 'include' })
    const json = await res.json()
    return res.ok && json?.success ? json.data : null
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}
