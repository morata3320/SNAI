import api from './api'
import { listaDe } from './response'

export interface ListParams {
  activo?: boolean
  estado?: string
}

export interface CrudService<T, P> {
  getAll(params?: ListParams): Promise<T[]>
  create(payload: P): Promise<T>
  update(id: number, payload: Partial<P>): Promise<T>
  deactivate(id: number): Promise<void>
}

function query(params?: ListParams): string {
  if (!params) return ''
  const qs = new URLSearchParams()
  if (params.activo !== undefined) qs.set('activo', String(params.activo))
  if (params.estado) qs.set('estado', params.estado)
  const s = qs.toString()
  return s ? `?${s}` : ''
}

/** Fábrica de servicios CRUD: todos hablan con rutas REST /api/v1 reales. */
export function createCrudService<T extends { id: number }, P>(path: string): CrudService<T, P> {
  return {
    async getAll(params) {
      const { data } = await api.get<T[]>(`${path}${query(params)}`)
      return listaDe<T>(data)
    },
    async create(payload) {
      const { data } = await api.post<T>(path, payload)
      return data
    },
    async update(id, payload) {
      const { data } = await api.patch<T>(`${path}/${id}`, payload)
      return data
    },
    async deactivate(id) {
      await api.delete(`${path}/${id}`)
    },
  }
}
