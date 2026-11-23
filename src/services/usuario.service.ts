import api from './api'
import { listaDe } from './response'
import { ENDPOINTS } from './backend-contract'

export interface RolDto {
  id: number
  codigo?: string
  nombre: string
}

export interface UsuarioDto {
  id?: number
  uzdi_id?: number
  tppr_id?: number
  perfiles_ids?: number[]
  cedula?: string
  cargo?: string
  nombres: string
  apellidos: string
  login: string
  correo?: string
  telefono?: string
  sexo?: 'M' | 'F' | 'O'
  direccion?: string
  observaciones?: string
  password?: string
  estado?: boolean
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
  perfiles?: RolDto[]
  estado?: boolean
  debe_cambiar_clave?: boolean
}

export const usuarioService = {
  async getAll(activo: 'true' | 'false' = 'true'): Promise<UsuarioRow[]> {
    const { data: res } = await api.get<{ message: string; data: ApiUser[] }>(ENDPOINTS.users, {
      params: activo === 'true' ? undefined : { activo },
    })
    const list = listaDe<ApiUser>(res)
    const perfiles = await Promise.all(list.map(async (u) => {
      if (u.perfiles) return u.perfiles
      const { data } = await api.get(`${ENDPOINTS.users}/${u.id}/perfiles`)
      return listaDe<RolDto>(data)
    }))
    return list.map((u, index) => ({
      id: u.id,
      nombre: `${u.nombres} ${u.apellidos}`,
      login: u.login,
      correo: u.correo ?? '—',
      cedula: u.cedula ?? '—',
      cargo: u.cargo ?? '—',
      uzdi_id: u.uzdi_id,
      roles: perfiles[index] ?? [],
      estado: u.estado === false ? 'Inactivo' : 'Activo',
      tono: u.estado === false ? 'slate' : 'green',
      debeCambiarClave: !!u.debe_cambiar_clave,
      _raw: {
        id: u.id,
        uzdi_id: u.uzdi_id,
        tppr_id: u.tppr_id,
        perfiles_ids: perfiles[index]?.map(r => r.id) ?? [],
        cedula: u.cedula,
        cargo: u.cargo,
        nombres: u.nombres,
        apellidos: u.apellidos,
        login: u.login,
        correo: u.correo,
        telefono: u.telefono,
        estado: u.estado,
        debe_cambiar_clave: u.debe_cambiar_clave,
      },
    }))
  },

  async create(dto: Omit<UsuarioDto, 'id'>): Promise<UsuarioDto> {
    const payload = {
      nombres: dto.nombres, apellidos: dto.apellidos, correo: dto.correo,
      login: dto.login, password: dto.password, telefono: dto.telefono,
      uzdi_id: dto.uzdi_id, tppr_id: dto.tppr_id, perfiles_ids: dto.perfiles_ids,
      sexo: dto.sexo, direccion: dto.direccion, observaciones: dto.observaciones,
    }
    const { data } = await api.post<UsuarioDto>(ENDPOINTS.users, payload)
    return data
  },

  async update(id: number, dto: Partial<UsuarioDto>): Promise<UsuarioDto> {
    const payload = {
      nombres: dto.nombres, apellidos: dto.apellidos, correo: dto.correo,
      login: dto.login, password: dto.password || undefined, telefono: dto.telefono,
      uzdi_id: dto.uzdi_id, tppr_id: dto.tppr_id, perfiles_ids: dto.perfiles_ids,
      sexo: dto.sexo, direccion: dto.direccion, observaciones: dto.observaciones,
    }
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
