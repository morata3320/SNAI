// Adaptador de axios para el modo demo: responde en memoria a las mismas rutas que usa el backend real.
// Se activa solo con VITE_USE_MOCK=true (ver services/api.ts). Los datos se reinician al recargar.
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import * as db from './data'
import {
  can,
  canAccess,
  defaultPermissions,
  roleKey,
  type Action,
  type ModuleId,
  type RolePermissions,
} from '../../router/access'

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

type Row = Record<string, any>

const find = (list: Row[], id: unknown) => list.find((x) => x.id === Number(id))
const ref = (list: Row[], id: unknown) => {
  const r = find(list, id)
  return r ? { id: r.id, nombre: r.nombre } : null
}
const adolRef = (id: unknown) => {
  const a = find(db.adolescentes, id)
  return a ? { id: a.id, nombre: a.nombre, apellido: a.apellido, cedula: a.cedula } : null
}
const userRef = (id: unknown) => {
  const u = find(db.usuarios, id)
  return u ? { id: u.id, nombre: `${u.nombres} ${u.apellidos}`, login: u.login } : null
}
const tallerRef = (id: unknown) => {
  const t = find(db.talleres, id)
  return t ? { id: t.id, nombre: t.nombre, fecha: t.fecha } : null
}
const representanteRef = (id: unknown) => {
  const r = find(db.representantes, id)
  return r ? { id: r.id, nombre: `${r.nombres} ${r.apellidos}` } : null
}
const expedienteRef = (id: unknown) => {
  const e = find(db.expedientes, id)
  return e ? { id: e.id, num_causa: e.num_causa, estado: e.estado } : null
}

const hydrate: Record<string, (r: Row) => Row> = {
  '/adolescente': (a) => ({
    ...a,
    nacionalidad: ref(db.nacionalidades, a.nacn_id),
    estadoCivil: ref(db.estadosCiviles, a.etcv_id),
    etnia: ref(db.etnias, a.etna_id),
    canton: ref(db.cantones, a.cntn_id),
    provincia: ref(db.provincias, a.provincia_id),
    gdo: a.gdo_id ? ref(db.gdos, a.gdo_id) : null,
    uzdi: ref(db.uzdis, a.uzdi_id),
  }),
  '/expediente': (e) => ({
    ...e,
    adolescente: adolRef(e.adlc_id),
    uzdi: ref(db.uzdis, e.uzdi_id),
    infraccion: ref(db.infracciones, e.infc_id),
    medida: ref(db.medidas, e.mdso_id),
  }),
  '/medida-socioeducativa': (m) => ({ ...m }),
  '/gdo': (g) => ({ ...g }),
  '/representante': (r) => ({
    ...r,
    uzdi: ref(db.uzdis, r.uzdi_id),
    adolescentes: db.vinculosRepresentante
      .filter((v) => v.representante_id === r.id && v.activo !== false)
      .map((v) => ({ ...adolRef(v.adlc_id), parentesco: v.parentesco, principal: v.principal })),
  }),
  '/adolescente-representante': (v) => ({
    ...v,
    representante: representanteRef(v.representante_id),
    adolescente: adolRef(v.adlc_id),
    uzdi: ref(db.uzdis, v.uzdi_id),
  }),
  '/contexto-familiar/intervencion': (c) => ({
    ...c,
    representante: representanteRef(c.representante_id),
    adolescente: adolRef(c.adlc_id),
    uzdi: ref(db.uzdis, c.uzdi_id),
  }),
  '/contexto-familiar/ficha': (c) => ({
    ...c,
    representante: representanteRef(c.representante_id),
    adolescente: adolRef(c.adlc_id),
    uzdi: ref(db.uzdis, c.uzdi_id),
  }),
  '/ficha-psicologica': (f) => ({
    ...f,
    adolescente: adolRef(f.adlc_id),
    uzdi: ref(db.uzdis, f.uzdi_id),
  }),
  '/taller': (t) => {
    const asistentes = db.asistenciasTaller.filter((a) => a.taller_id === t.id && a.activo !== false)
    return {
      ...t,
      uzdi: ref(db.uzdis, t.uzdi_id),
      asistentes: asistentes.length,
      asistencias: asistentes.filter((a) => a.asistencia_adolescente).length,
    }
  },
  '/asistencia-taller': (a) => ({
    ...a,
    taller: tallerRef(a.taller_id),
    adolescente: adolRef(a.adlc_id),
    uzdi: ref(db.uzdis, a.uzdi_id),
  }),
  '/informacion-educativa': (e) => ({
    ...e,
    adolescente: adolRef(e.adlc_id),
    uzdi: ref(db.uzdis, e.uzdi_id),
  }),
  '/documento-expediente': (d) => ({
    ...d,
    adolescente: adolRef(d.adlc_id),
    expediente: expedienteRef(d.expediente_id),
    uzdi: ref(db.uzdis, d.uzdi_id),
  }),
  '/alerta-salud': (a) => ({
    ...a,
    adolescente: adolRef(a.adlc_id),
    uzdi: ref(db.uzdis, a.uzdi_id),
  }),
  '/asignacion-caso': (a) => ({
    ...a,
    adolescente: adolRef(a.adlc_id),
    expediente: expedienteRef(a.expediente_id),
    usuario: userRef(a.usuario_id),
    uzdi: ref(db.uzdis, a.uzdi_id),
  }),
  '/medida-expediente': (a) => ({
    ...a,
    adolescente: adolRef(a.adlc_id),
    expediente: expedienteRef(a.expediente_id),
    medida: ref(db.medidas, a.mdso_id),
    uzdi: ref(db.uzdis, a.uzdi_id),
  }),
  '/informe-tecnico': (i) => ({
    ...i,
    adolescente: adolRef(i.adlc_id),
    generador: userRef(i.generado_por),
    uzdi: ref(db.uzdis, i.uzdi_id),
  }),
  '/canton': (c) => ({ ...c, provincia: ref(db.provincias, c.provincia_id) }),
  '/historial': (b) => ({ ...b }),
  '/perfil': (p) => ({ ...p }),
  '/uzdi': (u) => ({ ...u, canton: ref(db.cantones, u.cntn_id), provincia: ref(db.provincias, u.provincia_id) }),
}

interface Collection {
  path: string
  rows: Row[]
  module: ModuleId
  /** Filtra por la UZDI del usuario (salvo Superadministrador). */
  scoped?: boolean
  /** Lectura abierta a cualquier usuario autenticado (catálogos de apoyo). */
  readOpen?: boolean
  /** Solo lectura desde la interfaz (la bitácora). */
  readOnly?: boolean
  duplicate?: (body: Row) => string | null
}

const collections: Collection[] = [
  { path: '/adolescente', rows: db.adolescentes, module: 'adolescentes', scoped: true,
    duplicate: (b) => db.adolescentes.some((a) => a.cedula === b.cedula) ? 'Ya existe un adolescente con esa cédula.' : null },
  { path: '/expediente', rows: db.expedientes, module: 'expedientes', scoped: true },
  { path: '/medida-socioeducativa', rows: db.medidas, module: 'medidas', readOpen: true },
  { path: '/gdo', rows: db.gdos, module: 'gdos', readOpen: true },
  { path: '/nacionalidad', rows: db.nacionalidades, module: 'catalogos', readOpen: true },
  { path: '/estado-civil', rows: db.estadosCiviles, module: 'catalogos', readOpen: true },
  { path: '/etnia', rows: db.etnias, module: 'catalogos', readOpen: true },
  { path: '/canton', rows: db.cantones, module: 'catalogos', readOpen: true },
  { path: '/provincia', rows: db.provincias, module: 'catalogos', readOpen: true },
  { path: '/infraccion', rows: db.infracciones, module: 'catalogos', readOpen: true },
  { path: '/representante', rows: db.representantes, module: 'representantes', readOpen: true, scoped: true },
  { path: '/adolescente-representante', rows: db.vinculosRepresentante, module: 'representantes', scoped: true },
  { path: '/contexto-familiar/intervencion', rows: db.contextoIntervenciones, module: 'contexto-familiar', scoped: true },
  { path: '/contexto-familiar/ficha', rows: db.contextoFichas, module: 'contexto-familiar', scoped: true },
  { path: '/ficha-psicologica', rows: db.fichasPsicologicas, module: 'fichas', scoped: true },
  { path: '/taller', rows: db.talleres, module: 'talleres', scoped: true },
  { path: '/asistencia-taller', rows: db.asistenciasTaller, module: 'asistencia-talleres', scoped: true,
    duplicate: (b) => db.asistenciasTaller.some((a) => a.activo !== false && a.taller_id === Number(b.taller_id) && a.adlc_id === Number(b.adlc_id))
      ? 'Ya existe la asistencia de ese adolescente para el taller.' : null },
  { path: '/informacion-educativa', rows: db.informacionEducativa, module: 'educacion', scoped: true },
  { path: '/documento-expediente', rows: db.documentos, module: 'documentos', scoped: true },
  { path: '/alerta-salud', rows: db.alertasSalud, module: 'alertas-salud', scoped: true },
  { path: '/asignacion-caso', rows: db.asignacionesCaso, module: 'asignacion-casos', scoped: true },
  { path: '/medida-expediente', rows: db.asignacionesMedida, module: 'medidas', scoped: true },
  { path: '/informe-tecnico', rows: db.informesTecnicos, module: 'informes', scoped: true },
  { path: '/historial', rows: db.bitacora, module: 'bitacora', readOnly: true },
  { path: '/perfil', rows: db.perfiles, module: 'perfiles', readOpen: true },
  { path: '/uzdi', rows: db.uzdis, module: 'uzdi', readOpen: true },
]

const catalogs: { path: string; rows: Row[] }[] = [
  { path: '/nacionalidad', rows: db.nacionalidades },
  { path: '/estado-civil', rows: db.estadosCiviles },
  { path: '/etnia', rows: db.etnias },
  { path: '/canton', rows: db.cantones },
  { path: '/provincia', rows: db.provincias },
  { path: '/infraccion', rows: db.infracciones },
]

function publicUser(u: Row): Row {
  const { password: _password, ...rest } = u
  return rest
}

function reply(config: InternalAxiosRequestConfig, status: number, data: unknown): Promise<AxiosResponse> {
  const response: AxiosResponse = { data, status, statusText: String(status), headers: {}, config }
  if (status >= 200 && status < 300) return Promise.resolve(response)
  return Promise.reject(Object.assign(new Error(`Request failed with status code ${status}`), { response, config, isAxiosError: true }))
}

function usuarioDeToken(config: InternalAxiosRequestConfig): Row | null {
  const headers = config.headers as Row
  const raw = String(
    typeof headers?.get === 'function'
      ? headers.get('Authorization')
      : (headers?.Authorization ?? headers?.authorization ?? ''),
  )
  const m = raw.match(/^Bearer demo-token-(\d+)$/)
  if (!m) return null
  const user = find(db.usuarios, m[1])
  return user && user.activo !== false ? user : null
}

function permisosDe(tppr: number): RolePermissions {
  return (db.permisosPorRol[tppr] as RolePermissions | undefined) ?? defaultPermissions(tppr)
}

function esGlobal(user: Row): boolean {
  return roleKey(user.tppr_id) === 'superadmin'
}

function ahora(): string {
  return new Date().toISOString()
}

function registrarBitacora(
  user: Row | null,
  tipo: string,
  entidad: string,
  entidadId: number | null,
  detalle: string,
): void {
  const id = Math.max(0, ...db.bitacora.map((b) => b.id)) + 1
  db.bitacora.unshift({
    id,
    fecha: ahora(),
    usuario_id: user?.id ?? null,
    usuario: user?.login ?? 'sistema',
    tipo,
    entidad,
    entidad_id: entidadId,
    detalle,
  })
}

function conMetadatos(rec: Row, user: Row, creando: boolean): Row {
  const fecha = ahora()
  if (creando) {
    rec.creado_por = user.id
    rec.creado_en = fecha
    rec.activo = rec.activo ?? true
  }
  rec.modificado_por = user.id
  rec.modificado_en = fecha
  return rec
}

function coincideQuery(row: Row, query: Record<string, string>, path: string, user: Row): boolean {
  const activo = query.activo
  if (activo === 'all') {
    // sin filtro de estado
  } else if (activo === 'false') {
    if (row.activo !== false) return false
  } else if (row.activo === false) {
    return false
  }

  for (const [key, value] of Object.entries(query)) {
    if (key === 'activo' || !value) continue
    if (key === 'desde' || key === 'hasta') continue
    if (String(row[key] ?? '') !== value) return false
  }

  if (path === '/uzdi' && !esGlobal(user) && row.id !== user.uzdi_id) return false

  const esColeccionConUzdi = path !== '/uzdi' && path !== '/perfil' && path !== '/historial'
  if (esColeccionConUzdi && !esGlobal(user) && row.uzdi_id !== user.uzdi_id) return false
  return true
}

function resolver(url: string): { coll: Collection; id: number | null } | null {
  const ordenadas = [...collections].sort((a, b) => b.path.length - a.path.length)
  for (const coll of ordenadas) {
    if (url === coll.path) return { coll, id: null }
    if (url.startsWith(`${coll.path}/`)) {
      const resto = url.slice(coll.path.length + 1)
      if (/^\d+$/.test(resto)) return { coll, id: Number(resto) }
    }
  }
  return null
}

function duplicadoEnUsuarios(body: Row): string | null {
  if (body.login && db.usuarios.some((u) => u.login.toLowerCase() === String(body.login).toLowerCase())) {
    return 'Ya existe un usuario con ese login.'
  }
  if (body.cedula && db.usuarios.some((u) => u.cedula === body.cedula)) {
    return 'Ya existe un usuario con esa cédula.'
  }
  return null
}

export const mockAdapter: AxiosAdapter = async (config) => {
  await new Promise((r) => setTimeout(r, 120)) // latencia mínima para que se vean los estados de carga
  const method = (config.method ?? 'get').toLowerCase()
  const urlCompleta = config.url ?? ''
  const [url, rawQuery = ''] = urlCompleta.split('?')
  const query = Object.fromEntries(new URLSearchParams(rawQuery))
  const body: Row = typeof config.data === 'string' && config.data ? JSON.parse(config.data) : (config.data ?? {})
  const user = usuarioDeToken(config)

  // ── Autenticación ────────────────────────────────────────────
  if (url === '/auth/login' && method === 'post') {
    const key = String(body.login ?? '').trim().toLowerCase()
    const u = db.usuarios.find((x) => x.login.toLowerCase() === key || x.correo.toLowerCase() === key)
    if (!u || u.activo === false) {
      return reply(config, 401, { message: 'Usuario o contraseña incorrectos' })
    }
    if (u.password !== body.password) {
      return reply(config, 401, { message: 'Usuario o contraseña incorrectos' })
    }
    registrarBitacora(u, 'inicio_sesion', 'sesion', u.id, `Inicio de sesión del usuario #${u.id}`)
    return reply(config, 200, { message: 'Login correcto', token: `demo-token-${u.id}`, user: publicUser(u) })
  }

  if (url === '/auth/change-password' && method === 'post') {
    if (!user) return reply(config, 401, { message: 'Sesión no válida' })
    const objetivo = body.userId ? find(db.usuarios, body.userId) : user
    if (!objetivo) return reply(config, 404, { message: 'Usuario no encontrado' })
    if (objetivo.id !== user.id && roleKey(user.tppr_id) !== 'superadmin' && roleKey(user.tppr_id) !== 'admin') {
      return reply(config, 403, { message: 'No puede cambiar la contraseña de otro usuario' })
    }
    if (objetivo.password !== body.currentPassword) {
      return reply(config, 400, { message: 'La contraseña actual no es correcta' })
    }
    if (String(body.newPassword ?? '').length < 8) {
      return reply(config, 400, { message: 'La contraseña nueva debe tener al menos 8 caracteres' })
    }
    objetivo.password = body.newPassword
    objetivo.debe_cambiar_clave = false
    conMetadatos(objetivo, user, false)
    registrarBitacora(user, 'cambio_contrasena', 'usuario', objetivo.id, `Cambio de contraseña del usuario #${objetivo.id}`)
    return reply(config, 200, { message: 'Contraseña actualizada' })
  }

  // ── Permisos (RF-10) ─────────────────────────────────────────
  const matchPermisos = url.match(/^\/permisos\/(\d+)$/)
  if (matchPermisos) {
    const rol = Number(matchPermisos[1])
    if (!user) return reply(config, 401, { message: 'Sesión no válida' })
    if (method === 'get') {
      const propio = user.tppr_id === rol
      if (!propio && !can('permisos', 'view', user.tppr_id, permisosDe(user.tppr_id))) {
        return reply(config, 403, { message: 'No tiene permiso para consultar la matriz de permisos' })
      }
      return reply(config, 200, permisosDe(rol))
    }
    if (method === 'put' || method === 'patch' || method === 'post') {
      if (!can('permisos', 'edit', user.tppr_id, permisosDe(user.tppr_id))) {
        return reply(config, 403, { message: 'No tiene permiso para modificar la matriz de permisos' })
      }
      db.permisosPorRol[rol] = body as Row
      registrarBitacora(user, 'cambio_permisos', 'permisos', rol, `Actualización de la matriz del perfil #${rol}`)
      return reply(config, 200, { message: 'Matriz actualizada; se aplicará en el siguiente ingreso.' })
    }
  }

  // ── Parámetros (RNF-03/04) ───────────────────────────────────
  if (url === '/parametros') {
    if (!user) return reply(config, 401, { message: 'Sesión no válida' })
    if (method === 'get') return reply(config, 200, db.parametros)
    if (!can('parametros', 'edit', user.tppr_id, permisosDe(user.tppr_id))) {
      return reply(config, 403, { message: 'No tiene permiso para modificar los parámetros' })
    }
    Object.assign(db.parametros, body)
    registrarBitacora(user, 'cambio_parametros', 'parametros', null, 'Actualización de parámetros del sistema')
    return reply(config, 200, { data: db.parametros })
  }

  // ── Bitácora: la interfaz solo puede registrar eventos ───────
  if (url === '/bitacora' && method === 'post') {
    if (!user) return reply(config, 401, { message: 'Sesión no válida' })
    registrarBitacora(
      user,
      String(body.tipo ?? 'evento'),
      String(body.entidad ?? 'sistema'),
      body.entidad_id ?? null,
      String(body.detalle ?? 'Evento registrado desde la interfaz'),
    )
    return reply(config, 201, { message: 'Evento registrado' })
  }

  // ── Directorio de técnicos (RF-23): datos mínimos para asignar casos ──
  if (url === '/directorio' && method === 'get') {
    if (!user) return reply(config, 401, { message: 'Sesión no válida' })
    const lista = db.usuarios
      .filter((u) => u.activo !== false)
      .filter((u) => esGlobal(user) || u.uzdi_id === user.uzdi_id)
      .map((u) => ({
        id: u.id,
        nombre: `${u.nombres} ${u.apellidos}`,
        login: u.login,
        cargo: u.cargo,
        tppr_id: u.tppr_id,
        uzdi_id: u.uzdi_id,
      }))
    return reply(config, 200, lista)
  }

  // ── Usuarios (RF-01) ─────────────────────────────────────────
  const matchReset = url.match(/^\/users\/(\d+)\/reset-password$/)
  if (matchReset) {
    if (!user) return reply(config, 401, { message: 'Sesión no válida' })
    if (!can('usuarios', 'edit', user.tppr_id, permisosDe(user.tppr_id))) {
      return reply(config, 403, { message: 'No tiene permiso para restablecer contraseñas' })
    }
    const u = find(db.usuarios, matchReset[1])
    if (!u) return reply(config, 404, { message: 'Usuario no encontrado' })
    if (!esGlobal(user) && u.uzdi_id !== user.uzdi_id) {
      return reply(config, 403, { message: 'El usuario pertenece a otra UZDI' })
    }
    u.password = db.DEMO_PASSWORD
    u.debe_cambiar_clave = true
    registrarBitacora(user, 'restablecimiento_contrasena', 'usuario', u.id, `Restablecimiento de contraseña del usuario #${u.id}`)
    return reply(config, 200, { message: 'Contraseña restablecida', data: publicUser(u), temporal: db.DEMO_PASSWORD })
  }

  if (url === '/users' || /^\/users\/\d+$/.test(url)) {
    if (!user) return reply(config, 401, { message: 'Sesión no válida' })
    const id = url === '/users' ? null : Number(url.split('/')[2])

    if (method === 'get') {
      if (!canAccess('usuarios', user.tppr_id, permisosDe(user.tppr_id))) {
        return reply(config, 403, { message: 'No tiene permiso para consultar usuarios' })
      }
      const lista = db.usuarios
        .filter((u) => esGlobal(user) || u.uzdi_id === user.uzdi_id)
        .filter((u) => (query.activo === 'false' ? u.activo === false : u.activo !== false))
        .map(publicUser)
      return reply(config, 200, { message: 'ok', data: lista })
    }

    if (method === 'post') {
      if (!can('usuarios', 'create', user.tppr_id, permisosDe(user.tppr_id))) {
        return reply(config, 403, { message: 'No tiene permiso para crear usuarios' })
      }
      const duplicado = duplicadoEnUsuarios(body)
      if (duplicado) return reply(config, 409, { message: duplicado })
      const ids: number[] = body.roles_ids ?? (body.tppr_id ? [body.tppr_id] : [])
      const { roles_ids: _r, ...rest } = body
      const nuevo: Row = {
        ...rest,
        id: Math.max(0, ...db.usuarios.map((x) => x.id)) + 1,
        uzdi_id: esGlobal(user) ? (rest.uzdi_id ?? user.uzdi_id) : user.uzdi_id,
        tppr_id: ids[0] ?? 5,
        roles: db.ROLES.filter((r) => ids.includes(r.id)),
        activo: true,
        debe_cambiar_clave: true,
        password: rest.password || db.DEMO_PASSWORD,
      }
      conMetadatos(nuevo, user, true)
      db.usuarios.push(nuevo)
      registrarBitacora(user, 'creacion_usuario', 'usuario', nuevo.id, `Creación del usuario #${nuevo.id}`)
      return reply(config, 201, { message: 'Usuario creado', data: publicUser(nuevo) })
    }

    if (id === null) return reply(config, 404, { message: 'Ruta no disponible' })
    const u = find(db.usuarios, id)
    if (!u) return reply(config, 404, { message: 'Usuario no encontrado' })
    if (!esGlobal(user) && u.uzdi_id !== user.uzdi_id) {
      return reply(config, 403, { message: 'El usuario pertenece a otra UZDI' })
    }

    if (method === 'patch') {
      // RNF-01: cada usuario puede editar su propio perfil aunque no gestione usuarios.
      if (id === user.id && !can('usuarios', 'edit', user.tppr_id, permisosDe(user.tppr_id))) {
        const permitidos = ['nombres', 'apellidos', 'correo', 'telefono', 'cargo']
        for (const campo of permitidos) {
          if (campo in body) u[campo] = body[campo]
        }
        conMetadatos(u, user, false)
        registrarBitacora(user, 'modificacion_perfil', 'usuario', u.id, `Actualización del perfil propio del usuario #${u.id}`)
        return reply(config, 200, { message: 'ok', data: publicUser(u) })
      }
      if (!can('usuarios', 'edit', user.tppr_id, permisosDe(user.tppr_id))) {
        return reply(config, 403, { message: 'No tiene permiso para editar usuarios' })
      }
      if (body.login && db.usuarios.some((x) => x.id !== u.id && x.login.toLowerCase() === String(body.login).toLowerCase())) {
        return reply(config, 409, { message: 'Ya existe un usuario con ese login.' })
      }
      if (body.cedula && db.usuarios.some((x) => x.id !== u.id && x.cedula === body.cedula)) {
        return reply(config, 409, { message: 'Ya existe un usuario con esa cédula.' })
      }
      const { roles_ids, ...rest } = body
      Object.assign(u, rest)
      if (Array.isArray(roles_ids) && roles_ids.length) {
        u.roles = db.ROLES.filter((r) => roles_ids.includes(r.id))
        u.tppr_id = roles_ids[0]
      }
      conMetadatos(u, user, false)
      registrarBitacora(user, 'modificacion_usuario', 'usuario', u.id, `Actualización del usuario #${u.id}`)
      return reply(config, 200, { message: 'ok', data: publicUser(u) })
    }

    if (method === 'delete') {
      if (!can('usuarios', 'deactivate', user.tppr_id, permisosDe(user.tppr_id))) {
        return reply(config, 403, { message: 'No tiene permiso para desactivar usuarios' })
      }
      if (u.id === user.id) return reply(config, 400, { message: 'No puede desactivar su propia cuenta' })
      u.activo = false
      conMetadatos(u, user, false)
      registrarBitacora(user, 'desactivacion_usuario', 'usuario', u.id, `Desactivación del usuario #${u.id}`)
      return reply(config, 200, { message: 'Usuario desactivado', data: publicUser(u) })
    }
  }

  // ── Descarga de reportes (RF-16): solo metadatos agregados ──
  if (url === '/reporte/descarga' && method === 'post') {
    if (!user) return reply(config, 401, { message: 'Sesión no válida' })
    if (!canAccess('reportes', user.tppr_id, permisosDe(user.tppr_id))) {
      return reply(config, 403, { message: 'No tiene permiso para descargar reportes' })
    }
    registrarBitacora(
      user,
      'descarga_reporte',
      'reporte',
      null,
      `Descarga de reporte "${String(body.tipo ?? 'Estadístico general')}" en formato ${String(body.formato ?? 'PDF')}`,
    )
    return reply(config, 201, { message: 'Descarga registrada' })
  }

  // ── Informe técnico (RF-27): la generación queda en bitácora ──
  if (url === '/informe-tecnico' && method === 'post') {
    if (!user) return reply(config, 401, { message: 'Sesión no válida' })
    if (!can('informes', 'create', user.tppr_id, permisosDe(user.tppr_id))) {
      return reply(config, 403, { message: 'No tiene permiso para generar informes técnicos' })
    }
    if (!body.adlc_id) return reply(config, 400, { message: 'Seleccione un adolescente.' })
    const nuevo: Row = {
      ...body,
      id: Math.max(0, ...db.informesTecnicos.map((x) => x.id)) + 1,
      generado_por: user.id,
      fecha: ahora().slice(0, 10),
      uzdi_id: user.uzdi_id,
    }
    conMetadatos(nuevo, user, true)
    db.informesTecnicos.push(nuevo)
    registrarBitacora(user, 'generacion_informe', 'informe', nuevo.id, `Generación de informe técnico #${nuevo.id}`)
    return reply(config, 201, nuevo)
  }

  // ── Colecciones CRUD declarativas ────────────────────────────
  const encontrado = resolver(url)
  if (encontrado && user) {
    const { coll, id } = encontrado
    const puedeLeer = coll.readOpen || canAccess(coll.module, user.tppr_id, permisosDe(user.tppr_id))
    const esEscritura = method === 'post' || method === 'patch' || method === 'delete'

    if (!puedeLeer && method === 'get') {
      return reply(config, 403, { message: 'No tiene permiso para consultar esta información' })
    }
    if (esEscritura) {
      const accion: Action = method === 'post' ? 'create' : method === 'patch' ? 'edit' : 'deactivate'
      if (coll.readOnly || !can(coll.module, accion, user.tppr_id, permisosDe(user.tppr_id))) {
        return reply(config, 403, { message: 'No tiene permiso para modificar esta información' })
      }
    }

    if (method === 'get' && id === null) {
      const filas = coll.rows
        .filter((row) => coincideQuery(row, query, coll.path, user))
        .map((row) => (hydrate[coll.path] ? hydrate[coll.path](row) : { ...row }))
      return reply(config, 200, filas)
    }

    if (method === 'post') {
      const duplicado = coll.duplicate?.(body)
      if (duplicado) return reply(config, 409, { message: duplicado })
      const nuevo: Row = {
        ...body,
        id: Math.max(0, ...coll.rows.map((x) => x.id)) + 1,
      }
      if (coll.scoped && !esGlobal(user)) nuevo.uzdi_id = user.uzdi_id
      conMetadatos(nuevo, user, true)
      coll.rows.push(nuevo)
      registrarBitacora(user, `creacion_${coll.module}`, coll.module, nuevo.id, `Se registró ${coll.module} #${nuevo.id}`)
      return reply(config, 201, hydrate[coll.path] ? hydrate[coll.path](nuevo) : nuevo)
    }

    const rec = id !== null ? find(coll.rows, id) : undefined
    if (!rec) return reply(config, 404, { message: 'Registro no encontrado' })
    if (coll.scoped && !esGlobal(user) && rec.uzdi_id !== user.uzdi_id) {
      return reply(config, 403, { message: 'El registro pertenece a otra UZDI' })
    }
    if (coll.path === '/uzdi' && !esGlobal(user) && rec.id !== user.uzdi_id) {
      return reply(config, 403, { message: 'Solo puede consultar su propia UZDI' })
    }

    if (method === 'get') {
      return reply(config, 200, hydrate[coll.path] ? hydrate[coll.path](rec) : { ...rec })
    }

    if (method === 'patch') {
      if (coll.path === '/adolescente' && body.cedula && db.adolescentes.some((a) => a.id !== rec.id && a.cedula === body.cedula)) {
        return reply(config, 409, { message: 'Ya existe un adolescente con esa cédula.' })
      }
      if (coll.scoped && !esGlobal(user)) delete body.uzdi_id
      Object.assign(rec, body)
      conMetadatos(rec, user, false)
      registrarBitacora(user, `modificacion_${coll.module}`, coll.module, rec.id, `Actualización de ${coll.module} #${rec.id}`)
      return reply(config, 200, hydrate[coll.path] ? hydrate[coll.path](rec) : { ...rec })
    }

    if (method === 'delete') {
      rec.activo = false
      // RF-25: los documentos no se eliminan, se archivan.
      if (coll.path === '/documento-expediente') rec.estado = 'Archivado'
      if (coll.path === '/representante') {
        // Los vínculos se conservan para el historial, pero dejan de estar vigentes.
        for (const v of db.vinculosRepresentante) {
          if (v.representante_id === rec.id) {
            v.activo = false
            v.principal = false
          }
        }
      }
      if (coll.path === '/adolescente-representante') {
        rec.principal = false
      }
      conMetadatos(rec, user, false)
      registrarBitacora(user, `desactivacion_${coll.module}`, coll.module, rec.id, `Desactivación de ${coll.module} #${rec.id}`)
      return reply(config, 200, { message: 'Registro desactivado; el historial se conserva.' })
    }
  }

  // ── Catálogos de apoyo (solo lectura) ────────────────────────
  if (user && method === 'get') {
    const catalogo = catalogs.find((c) => c.path === url)
    if (catalogo) {
      const activo = query.activo
      const filas = catalogo.rows.filter((row) =>
        activo === 'all' ? true : activo === 'false' ? row.activo === false : row.activo !== false,
      )
      return reply(config, 200, filas)
    }
  }

  if (!user && url.startsWith('/')) {
    return reply(config, 401, { message: 'Sesión no válida' })
  }

  return reply(config, 404, { message: `Ruta de demostración no disponible: ${method.toUpperCase()} ${url}` })
}
