import api from './api'
import { ENDPOINTS } from './backend-contract'

export interface LoginResponse {
  token: string
  user: Record<string, unknown>
}

type Dict = Record<string, unknown>

function comoObjeto(value: unknown): Dict {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Dict : {}
}

function sinSecretos(value: Dict): Dict {
  const limpio = { ...value }
  for (const key of Object.keys(limpio)) {
    if (/password|contrasena|contraseña|secret|token|hash|salt/i.test(key)) delete limpio[key]
  }
  return limpio
}

/** Solo se usa para pintar la interfaz, NUNCA para comprobar permisos del backend. */
function claimsJwt(token: string): Dict {
  try {
    const payload = token.split('.')[1]
    if (!payload) return {}
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    return comoObjeto(JSON.parse(atob(base64)))
  } catch {
    return {}
  }
}

function idDeRol(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value)
  const role = comoObjeto(value)
  if (Object.keys(role).length) return idDeRol(role.id ?? role.tppr_id ?? role.nombre)
  if (typeof value !== 'string') return undefined
  const normal = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (/super.?admin/.test(normal)) return 4
  if (/administrador|^admin$/.test(normal)) return 3
  if (/coordina/.test(normal)) return 2
  if (/trabajador.?social|^tsocial$/.test(normal)) return 1
  if (/psicolog/.test(normal)) return 6
  if (/educad/.test(normal)) return 7
  if (/juridic|abogad/.test(normal)) return 8
  return undefined
}

function normalizarSesion(raw: unknown, login: string): LoginResponse {
  const payload = comoObjeto(raw)
  const tokens = comoObjeto(payload.tokens)
  const token = [payload.token, payload.access_token, payload.accessToken, payload.jwt,
    tokens.access_token, tokens.accessToken]
    .find((valor): valor is string => typeof valor === 'string' && valor.length > 0)

  if (!token) throw new Error('El servidor respondió al login, pero no devolvió un token JWT de acceso.')

  const claims = claimsJwt(token)
  const usuario = comoObjeto(payload.user ?? payload.usuario ?? payload.usuarioActual ?? payload.profile)
  // La respuesta de login tiene prioridad sobre los claims del token.
  const merged = sinSecretos({ ...claims, ...usuario })
  const listaRoles = Array.isArray(merged.roles) ? merged.roles : []
  const listaIds = Array.isArray(merged.roles_ids) ? merged.roles_ids : []
  const roleId = idDeRol(merged.tppr_id ?? merged.tpprId ?? merged.rol_id ?? merged.role_id)
    ?? idDeRol(merged.rol ?? merged.role ?? merged.perfil)
    ?? idDeRol(listaIds[0]) ?? idDeRol(listaRoles[0])
  const id = Number(merged.id ?? merged.user_id ?? merged.userId ?? merged.sub)
  const uzdi = comoObjeto(merged.uzdi)
  const uzdiId = Number(merged.uzdi_id ?? merged.uzdiId ?? uzdi.id)
  const normalizedUser: Dict = {
    ...merged,
    login: merged.login ?? merged.username ?? login,
    nombres: merged.nombres ?? merged.nombre ?? login,
    apellidos: merged.apellidos ?? merged.apellido ?? '',
    // Perfil 5: acceso mínimo si el backend no ha enviado ningún rol.
    tppr_id: roleId ?? 5,
  }
  if (Number.isInteger(id) && id > 0) normalizedUser.id = id
  if (Number.isInteger(uzdiId) && uzdiId > 0) normalizedUser.uzdi_id = uzdiId
  return { token, user: normalizedUser }
}

export const authService = {
  async login(login: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<unknown>(ENDPOINTS.auth.login, { login, password })
    return normalizarSesion(data, login)
  },

  async logout(token: string): Promise<void> {
    await api.post(ENDPOINTS.auth.logout, undefined, {
      headers: { Authorization: `Bearer ${token}` },
    })
  },
}
