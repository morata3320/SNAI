import api from './api'
import { listaDe } from './response'
import { ENDPOINTS } from './backend-contract'

export interface ExpedienteAdolescenteRef {
  id: number
  nombre: string
  apellido: string
  cedula: string
}

export interface ExpedienteCatRef {
  id: number
  nombre: string
}

/** Contrato real DDL v8: las medidas viven en /medida-expediente. */
export interface ExpedienteDto {
  id?: number
  adlc_id?: number
  uzdi_id?: number
  infc_id?: number
  numero_causa?: string | null
  estado_procesal: 'En proceso' | 'Atraso' | 'Incomparecencia' | 'Concluido' | 'Archivado'
  observaciones?: string | null
  estado?: boolean
  adolescente?: ExpedienteAdolescenteRef
  uzdi?: ExpedienteCatRef
  infraccion?: ExpedienteCatRef
}

export interface ExpedientePayload {
  adlc_id: number
  uzdi_id: number
  infc_id: number
  numero_causa?: string
  estado_procesal?: ExpedienteDto['estado_procesal']
  observaciones?: string
  estado?: boolean
}

function toTono(estado: string): string {
  const map: Record<string, string> = {
    'En proceso': 'green', Atraso: 'amber', Incomparecencia: 'red',
    Concluido: 'slate', Archivado: 'slate',
  }
  return map[estado] ?? 'slate'
}

export const expedienteService = {
  async getAll() {
    const { data } = await api.get<ExpedienteDto[]>(ENDPOINTS.expediente)
    return listaDe<ExpedienteDto>(data).map((e) => ({
      id: e.id!,
      codigo: `EXP-${String(e.id!).padStart(4, '0')}`,
      causa: e.numero_causa || '—',
      adol: e.adolescente ? `${e.adolescente.nombre} ${e.adolescente.apellido}` : '—',
      ced: e.adolescente?.cedula ?? '—',
      infraccion: e.infraccion?.nombre ?? '—',
      uzdi: e.uzdi?.nombre ?? '—',
      estado: e.estado_procesal,
      tono: toTono(e.estado_procesal),
      observaciones: e.observaciones ?? '',
      _raw: e,
    }))
  },

  async create(payload: ExpedientePayload) {
    const { data } = await api.post<ExpedienteDto>(ENDPOINTS.expediente, payload)
    return data
  },

  async update(id: number, payload: Partial<ExpedientePayload>) {
    const { data } = await api.patch<ExpedienteDto>(`${ENDPOINTS.expediente}/${id}`, payload)
    return data
  },

  async remove(id: number) {
    await api.delete(`${ENDPOINTS.expediente}/${id}`)
  },
}
