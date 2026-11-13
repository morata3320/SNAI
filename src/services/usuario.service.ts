import api from './api'
import { listaDe } from './response'
import { ENDPOINTS } from './backend-contract'

export interface RolDto {
  id: number
  nombre: string
}

export interface UsuarioDto {
  id?: number
  uzdi_id?: number
  tppr_id?: number
  tppr_ids?: number[]
  cedula?: string
  cargo?: string
  nombres: string
  apellidos: string
  login: string
  correo?: string
  telefono?: string
  password?: string
  activo?: boolean
  debe_cambiar_clave?: boolean
}

export interface UsuarioRow {
  id: number
  nombre: string
  login: string
  correo: string
  cedula: string
  cargo: string
  uzdi_id?: number
  roles: RolDto[]
  estado: string
  tono: string
  debeCambiarClave: boolean
  _raw: UsuarioDto
}

interface ApiUser {
  id: number
  uzdi_id?: number
  tppr_id?: number
  cedula?: string
  cargo?: string
  nombres: string
  apellidos: string
  correo?: string
  login: string
  telefono?: string
  roles?: RolDto[]
  activo?: boolean
  debe_cambiar_clave?: boolean
}

export const usuarioService = {
  async getAll(activo: 'true' | 'false' = 'true'): Promise<UsuarioRow[]> {
    const { data: res } = await api.get<{ message: string; data: ApiUser[] }>(ENDPOINTS.users, {
      params: activo === 'true' ? undefined : { activo },
    })
    const list = listaDe<ApiUser>(res)
    return list.map(u => ({
      id: u.id,
      nombre: `${u.nombres} ${u.apellidos}`,
      login: u.login,
      correo: u.correo ?? '—',
      cedula: u.cedula ?? '—',
      cargo: u.cargo ?? '—',
      uzdi_id: u.uzdi_id,
      roles: u.roles ?? [],
      estado: u.activo === false ? 'Inactivo' : 'Activo',
      tono: u.activo === false ? 'slate' : 'green',
      debeCambiarClave: !!u.debe_cambiar_clave,
      _raw: {
        id: u.id,
        uzdi_id: u.uzdi_id,
        tppr_id: u.tppr_id,
        tppr_ids: u.roles?.map(r => r.id) ?? (u.tppr_id ? [u.tppr_id] : []),
        cedula: u.cedula,
        cargo: u.cargo,
        nombres: u.nombres,
        apellidos: u.apellidos,
        login: u.login,
        correo: u.correo,
        telefono: u.telefono,
        activo: u.activo,
        debe_cambiar_clave: u.debe_cambiar_clave,
      },
    }))
  },

  async create(dto: Omit<UsuarioDto, 'id'>): Promise<UsuarioDto> {
    const { tppr_ids, tppr_id: _tppr_id, ...rest } = dto
    const payload = { ...rest, roles_ids: tppr_ids }
    const { data } = await api.post<UsuarioDto>(ENDPOINTS.users, payload)
    return data
  },

  async update(id: number, dto: Partial<UsuarioDto>): Promise<UsuarioDto> {
    const { id: _id, tppr_ids, tppr_id: _tppr_id, ...rest } = dto
    const payload = { ...rest, roles_ids: tppr_ids }
    const { data: res } = await api.patch<{ message: string; data: UsuarioDto }>(`${ENDPOINTS.users}/${id}`, payload)
    return ((res as { data?: UsuarioDto }).data ?? res) as UsuarioDto
  },

  async deactivate(id: number): Promise<void> {
    await api.delete(`${ENDPOINTS.users}/${id}`)
  },

  /** Swagger no publica un endpoint de restablecimiento administrativo. */
  async resetPassword(_id: number): Promise<string> {
    throw new Error('El backend institucional no publica un endpoint para restablecer contraseñas.')
  },
}
