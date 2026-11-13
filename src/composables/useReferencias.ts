import { catalogoService } from '../services/catalogo.service'
import { adolescenteService } from '../services/adolescente.service'
import { expedienteService } from '../services/expediente.service'
import { directorioService } from '../services/directorio.service'
import { createCrudService } from '../services/crud.service'
import { ENDPOINTS } from '../services/backend-contract'

export type RefSource =
  | 'adolescentes' | 'representantes' | 'expedientes' | 'talleres'
  | 'medidas' | 'uzdis' | 'usuarios' | 'provincias' | 'cantones'
  | 'gdos' | 'perfiles' | 'infracciones'

export interface Opcion {
  value: number | string
  label: string
}

interface Row {
  id: number
  [key: string]: unknown
}

const cache = new Map<RefSource, Opcion[]>()

function refNombre(row: Row): string {
  const nombre = String(row.nombre ?? '')
  const apellido = String(row.apellido ?? '')
  return `${nombre} ${apellido}`.trim() || `#${row.id}`
}

async function cargarFuente(fuente: RefSource): Promise<Opcion[]> {
  switch (fuente) {
    case 'adolescentes': {
      const filas = await adolescenteService.getAll()
      return filas.map((a) => ({ value: a.id, label: `${a.nombre} · ${a.ced}` }))
    }
    case 'representantes': {
      const filas = await createCrudService<Row, Record<string, unknown>>(ENDPOINTS.representante).getAll()
      return filas.map((r) => ({ value: r.id, label: refNombre(r) }))
    }
    case 'expedientes': {
      const filas = await expedienteService.getAll()
      return filas.map((e) => ({ value: e.id, label: `${e.codigo} · ${e.adol}` }))
    }
    case 'talleres': {
      const filas = await createCrudService<Row, Record<string, unknown>>(ENDPOINTS.taller).getAll()
      return filas.map((t) => ({
        value: t.id,
        label: `${String(t.nombre ?? 'Taller')} · ${String(t.fecha ?? '')}`,
      }))
    }
    case 'medidas': {
      const filas = await catalogoService.medidas()
      return filas.map((m) => ({ value: m.id, label: m.nombre }))
    }
    case 'uzdis': {
      const filas = await catalogoService.uzdis()
      return filas.map((u) => ({ value: u.id, label: u.nombre }))
    }
    case 'usuarios': {
      const filas = await directorioService.getAll()
      return filas.map((u) => ({ value: u.id, label: `${u.nombre}${u.cargo ? ` · ${u.cargo}` : ''}` }))
    }
    case 'provincias': {
      const filas = await catalogoService.provincias()
      return filas.map((p) => ({ value: p.id, label: p.nombre }))
    }
    case 'cantones': {
      const filas = await catalogoService.cantones()
      return filas.map((c) => ({ value: c.id, label: c.nombre }))
    }
    case 'gdos': {
      const filas = await catalogoService.gdos()
      return filas.map((g) => ({ value: g.id, label: g.nombre }))
    }
    case 'perfiles': {
      const filas = await createCrudService<Row, Record<string, unknown>>(ENDPOINTS.perfil).getAll()
      return filas.filter((p) => p.activo !== false).map((p) => ({ value: p.id, label: refNombre(p) }))
    }
    case 'infracciones': {
      const filas = await catalogoService.infracciones()
      return filas.map((i) => ({ value: i.id, label: i.nombre }))
    }
  }
}

/** Opciones de un selector de referencia, con caché por sesión. */
export async function opcionesDe(fuente: RefSource): Promise<Opcion[]> {
  const guardadas = cache.get(fuente)
  if (guardadas) return guardadas
  try {
    const opciones = await cargarFuente(fuente)
    cache.set(fuente, opciones)
    return opciones
  } catch {
    return []
  }
}

export function limpiarReferencias(): void {
  cache.clear()
}
