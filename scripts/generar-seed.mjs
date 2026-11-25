// Genera la migración Flyway V2 a partir de:
//  · frontend/src/data/quito.js (zonas, puntos, partes, requisitos… y utilidades)
//  · frontend/src/data/quito-parroquias.json (OSM) para asignar zona por ubicación
//  · src/main/resources/datos/climatetrace-quito.json (scripts/descargar-climatetrace.mjs)
// Uso: node scripts/generar-seed.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import * as Q from '../frontend/src/data/quito.js'

const parroquias = JSON.parse(readFileSync(new URL('../frontend/src/data/quito-parroquias.json', import.meta.url)))
const ct = JSON.parse(readFileSync(new URL('../src/main/resources/datos/climatetrace-quito.json', import.meta.url)))
const zonaDe = (lon, lat) => Q.parroquiaDe(lon, lat, parroquias)?.zonaId ?? null

const s = (v) => (v == null ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`)
const rel = (d) => (d == null ? 'NULL' : `CURRENT_TIMESTAMP + INTERVAL '${d}' DAY`)
const now = 'CURRENT_TIMESTAMP'
const out = ['-- Generado por scripts/generar-seed.mjs — no editar a mano.', '-- Fuentes: Climate TRACE 2024 (CC BY 4.0), OpenStreetMap (ODbL), REMMAQ/EPN (estaciones). Ver datos/fuentes-informacion.json', '']
const ins = (t, cols, rows) => rows.forEach((r) => out.push(`INSERT INTO ${t} (${cols.join(', ')}) VALUES (${r.join(', ')});`))

ins('zona', ['id', 'nombre', 'latitud', 'longitud', 'descripcion'], Q.ZONAS.map((z) => [s(z.id), s(z.name), z.lat, z.lon, s(z.description)]))
const fuentes = Q.construirFuentes(ct, parroquias)
ins('fuente_emision', ['id', 'nombre', 'sector', 'zona_id', 'parroquia', 'latitud', 'longitud', 'anio', 'co2e_t', 'co2_t', 'ch4_t', 'pm25_t', 'nox_t', 'so2_t', 'co_t', 'descripcion', 'tipo_dato', 'referencia', 'fuente_coordenadas'],
  fuentes.map((f) => [s(f.id), s(f.name), s(f.sector), s(f.zoneId), s(f.parroquia), f.lat, f.lon, s(f.year), s(f.co2e), s(f.co2), s(f.ch4), s(f.pm25), s(f.nox), s(f.so2), s(f.co), s(f.description), s(f.dataType), s(f.reference), s(f.coordSource)]))
ins('punto_monitoreo', ['id', 'nombre', 'medio', 'sitio', 'zona_id', 'latitud', 'longitud', 'creado_en'], Q.PUNTOS.map((p) => [s(p.id), s(p.name), s(p.type), s(p.site), s(zonaDe(p.lon, p.lat)), p.lat, p.lon, now]))
ins('parte_interesada', ['id', 'nombre', 'tipo', 'contacto', 'influencia', 'percepcion', 'creado_en'], Q.PARTES.map((p) => [s(p.id), s(p.name), s(p.type), s(p.contact), p.influence, s(p.sentiment), now]))
ins('requisito', ['id', 'titulo', 'tipo', 'autoridad_id', 'vence', 'obligaciones', 'creado_en'], Q.REQUISITOS.map((r) => [s(r.id), s(r.title), s(r.kind), s(r.authorityId), rel(r.days), s(r.obligations), now]))
Q.REQUISITOS.forEach((r) => ins('requisito_punto', ['requisito_id', 'punto_id'], r.pointIds.map((p) => [s(r.id), s(p)])))
ins('hallazgo', ['id', 'titulo', 'severidad', 'estado', 'origen', 'punto_id', 'fecha_limite', 'responsable', 'creado_en'], Q.HALLAZGOS.map((h) => [s(h.id), s(h.title), s(h.severity), s(h.status), s(h.origin), s(h.pointId), rel(h.days), s(h.owner), now]))
ins('queja', ['id', 'parte_id', 'asunto', 'canal', 'estado', 'fecha', 'punto_id', 'creado_en'], Q.QUEJAS.map((c) => [s(c.id), s(c.stakeholderId), s(c.subject), s(c.channel), s(c.status), rel(c.days), s(c.pointId), now]))
ins('evidencia', ['id', 'nombre', 'entidad', 'entidad_id', 'fecha', 'creado_en'], Q.EVIDENCIAS.map((e) => [s(e.id), s(e.name), s(e.entity), s(e.entityId), rel(e.days), now]))

writeFileSync(new URL('../src/main/resources/db/migration/V2__datos_base_quito.sql', import.meta.url), out.join('\n') + '\n')
console.log('V2 generado:', fuentes.length, 'fuentes,', Q.PUNTOS.length, 'puntos')
fuentes.forEach((f) => console.log(' ', f.id, f.name, '|', f.sector, '|', f.zoneId, f.parroquia, '|', f.co2e))
Q.PUNTOS.forEach((p) => console.log(' ', p.id, zonaDe(p.lon, p.lat)))
