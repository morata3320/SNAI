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

// DDL: el expediente enlaza adolescente + infracción + medida + uzdi con estado y fechas.
export interface ExpedienteDto {
  id?: number
  estado: string
  num_causa: string
  juzgado: string
  defensor: string
  fecha_apertura: string
  fecha_cierre?: string | null
  observaciones?: string
  fecha_inicio_medida: string
  fecha_fin_medida?: string | null
  adlc_id?: number
  uzdi_id?: number
  infc_id?: number
  mdso_id?: number
  adolescente?: ExpedienteAdolescenteRef
  uzdi?: ExpedienteCatRef
  infraccion?: ExpedienteCatRef
  medida?: ExpedienteCatRef
}

export interface ExpedientePayload {
  adlc_id: number
  uzdi_id: number
  infc_id: number
  mdso_id: number
  estado: string
  num_causa: string
  juzgado: string
  defensor: string
  fecha_apertura: string
  fecha_cierre?: string
  observaciones?: string
  fecha_inicio_medida: string
  fecha_fin_medida?: string
}

function toTono(estado: string): string {
  const map: Record<string, string> = {
    'En proceso': 'green', 'Atraso': 'amber', 'Incomparecencia': 'red', 'Cerrado': 'slate',
  }
  return map[estado] ?? 'slate'
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.substring(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export const expedienteService = {
  async getAll() {
    const { data } = await api.get<ExpedienteDto[]>(ENDPOINTS.expediente)
    return listaDe<ExpedienteDto>(data).map((e) => {
      const anio = (e.fecha_inicio_medida ?? '').substring(0, 4) || String(new Date().getFullYear())
      return {
        id: e.id!,
        codigo: `EXP-${anio}-${String(e.id!).padStart(4, '0')}`,
        causa: e.num_causa || '—',
        adol: e.adolescente ? `${e.adolescente.nombre} ${e.adolescente.apellido}` : '—',
        ced: e.adolescente?.cedula ?? '—',
        infraccion: e.infraccion?.nombre ?? '—',
        juzgado: e.juzgado || '—',
        defensor: e.defensor || '—',
        observaciones: e.observaciones || '',
        medida: e.medida?.nombre ?? '—',
        uzdi: e.uzdi?.nombre ?? '—',
        apertura: formatDate(e.fecha_apertura),
        cierre: formatDate(e.fecha_cierre),
        inicio: formatDate(e.fecha_inicio_medida),
        fin: formatDate(e.fecha_fin_medida),
        estado: e.estado,
        tono: toTono(e.estado),
        _raw: e,
      }
    })
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
