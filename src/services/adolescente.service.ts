import api from './api'
import { listaDe } from './response'
import { ENDPOINTS } from './backend-contract'

export interface CatalogoRef {
  id: number
  nombre: string
}

// Estructura tal cual la devuelve el backend (DDL): catálogos resueltos por relación.
export interface AdolescenteDto {
  id?: number
  cedula: string
  nombre: string
  apellido: string
  fecha_nac: string
  sexo: string
  nved_nombre?: string | null
  hijos?: number
  reincide?: boolean
  fecha_ingr: string
  hijoPpl?: boolean
  observaciones?: string | null
  nacionalidad?: CatalogoRef
  estadoCivil?: CatalogoRef
  etnia?: CatalogoRef
  canton?: CatalogoRef
  gdo?: CatalogoRef | null
  nacn_id?: number
  etcv_id?: number
  etna_id?: number
  cntn_id?: number
  gdo_id?: number | null
  uzdi_id?: number
}

// Payload de creación/edición: FKs por id.
export interface AdolescentePayload {
  cedula: string
  nombre: string
  apellido: string
  fecha_nac: string
  sexo: string
  fecha_ingr: string
  nacn_id: number
  etcv_id: number
  etna_id: number
  cntn_id: number
  gdo_id?: number
  hijos?: number
  reincide?: boolean
  hijoPpl?: boolean
  nved_nombre?: string
  observaciones?: string
}

function formatDate(iso?: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.substring(0, 10).split('-')
  return `${d}/${m}/${y}`
}

function calcularEdad(fechaNac?: string): number {
  if (!fechaNac) return 0
  const hoy = new Date()
  const nac = new Date(fechaNac)
  let edad = hoy.getFullYear() - nac.getFullYear()
  if (hoy.getMonth() < nac.getMonth() ||
    (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) edad--
  return edad
}

export const adolescenteService = {
  async getAll() {
    const { data } = await api.get<AdolescenteDto[]>(ENDPOINTS.adolescente)
    return listaDe<AdolescenteDto>(data).map((a) => ({
      id: a.id!,
      nombre: `${a.nombre} ${a.apellido}`,
      ced: a.cedula,
      edad: calcularEdad(a.fecha_nac),
      nacionalidad: a.nacionalidad?.nombre ?? '—',
      canton: a.canton?.nombre ?? '—',
      ingreso: formatDate(a.fecha_ingr),
      _raw: a,
    }))
  },

  async create(payload: AdolescentePayload) {
    const { data } = await api.post<AdolescenteDto>(ENDPOINTS.adolescente, payload)
    return data
  },

  async update(id: number, payload: AdolescentePayload) {
    const { data } = await api.patch<AdolescenteDto>(`${ENDPOINTS.adolescente}/${id}`, payload)
    return data
  },

  async remove(id: number) {
    await api.delete(`${ENDPOINTS.adolescente}/${id}`)
  },
}
