import api from './api'
import { ENDPOINTS } from './backend-contract'

export interface UzdiDto {
  id?: number
  nombre: string
  zona: string
  direccion?: string
  telefono?: string
  correo?: string
  cntn_id?: number
}

export const uzdiService = {
  async getById(id: number): Promise<UzdiDto> {
    const { data } = await api.get<{ data: UzdiDto }>(`${ENDPOINTS.uzdi}/${id}`)
    return data.data ?? (data as unknown as UzdiDto)
  },

  async update(id: number, payload: Partial<UzdiDto>): Promise<UzdiDto> {
    const { data } = await api.patch<{ data: UzdiDto }>(`${ENDPOINTS.uzdi}/${id}`, payload)
    return data.data ?? (data as unknown as UzdiDto)
  },
}
