import api from './api'
import { listaDe } from './response'
import { ENDPOINTS } from './backend-contract'

export interface DirectorioItem {
  id: number
  nombre: string
  login: string
  cargo?: string
  tppr_id: number
  uzdi_id: number
}

interface UsuarioDirectorioApi {
  id: number
  nombres?: string
  apellidos?: string
  nombre?: string
  login: string
  cargo?: string
  tppr_id?: number
  uzdi_id?: number
  activo?: boolean
  roles?: Array<{ id: number }>
}

/** Directorio mínimo de técnicos activos de la UZDI (RF-23). */
export const directorioService = {
  async getAll(): Promise<DirectorioItem[]> {
    const { data } = await api.get<UsuarioDirectorioApi[]>(ENDPOINTS.users)
    return listaDe<UsuarioDirectorioApi>(data)
      .filter((usuario) => usuario.activo !== false)
      .map((usuario) => ({
        id: usuario.id,
        nombre: usuario.nombre ?? (`${usuario.nombres ?? ''} ${usuario.apellidos ?? ''}`.trim() || usuario.login),
        login: usuario.login,
        cargo: usuario.cargo,
        tppr_id: usuario.tppr_id ?? usuario.roles?.[0]?.id ?? 5,
        uzdi_id: usuario.uzdi_id ?? 0,
      }))
  },
}
