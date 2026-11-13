import api from './api'
import { listaDe } from './response'
import { ENDPOINTS } from './backend-contract'

// DDL: medida_socioeducativa es el CATÁLOGO de tipos de medida.
export interface MedidaDto {
  id?: number
  nombre: string
  duracion_meses?: number | null
}

export interface MedidaPayload {
  nombre: string
  duracion_meses?: number
}

export const medidaService = {
  async getAll() {
    const { data } = await api.get<MedidaDto[]>(ENDPOINTS.medidaSocioeducativa)
    return listaDe<MedidaDto>(data).map((m) => ({
      id: m.id!,
      codigo: `MED-${String(m.id!).padStart(4, '0')}`,
      nombre: m.nombre,
      duracion: m.duracion_meses ?? null,
      _raw: m,
    }))
  },

  async create(payload: MedidaPayload) {
    const { data } = await api.post<MedidaDto>(ENDPOINTS.medidaSocioeducativa, payload)
    return data
  },

  async update(id: number, payload: Partial<MedidaPayload>) {
    const { data } = await api.patch<MedidaDto>(`${ENDPOINTS.medidaSocioeducativa}/${id}`, payload)
    return data
  },

  async remove(id: number) {
    await api.delete(`${ENDPOINTS.medidaSocioeducativa}/${id}`)
  },
}
