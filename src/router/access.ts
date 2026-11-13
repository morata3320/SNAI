// Matriz de acceso por rol (AGENTS.md §2). Fuente única para guard, menú y mock.
// Fuente: informe de requerimientos, Tabla 3 y especificaciones RF.

export type RoleKey =
  | 'superadmin'
  | 'admin'
  | 'coordinador'
  | 'tsocial'
  | 'psicologo'
  | 'educador'
  | 'juridico'
  | 'usuario'

export type ModuleId =
  | 'dashboard'
  | 'perfil'
  | 'usuarios'
  | 'uzdi'
  | 'perfiles'
  | 'permisos'
  | 'parametros'
  | 'adolescentes'
  | 'representantes'
  | 'contexto-familiar'
  | 'alertas-salud'
  | 'fichas'
  | 'educacion'
  | 'talleres'
  | 'asistencia-talleres'
  | 'expedientes'
  | 'medidas'
  | 'documentos'
  | 'gdos'
  | 'catalogos'
  | 'asignacion-casos'
  | 'reportes'
  | 'informes'
  | 'bitacora'

/** C crear · E editar · B baja lógica · V solo consulta. */
export type Action = 'view' | 'create' | 'edit' | 'deactivate'

/** Permisos vigentes de un rol: módulo → acciones permitidas. */
export type RolePermissions = Partial<Record<ModuleId, Action[]>>

export const ROL_USUARIO = 5

export const ROLE_KEY: Record<number, RoleKey> = {
  1: 'tsocial',
  2: 'coordinador',
  3: 'admin',
  4: 'superadmin',
  5: 'usuario',
  6: 'psicologo',
  7: 'educador',
  8: 'juridico',
}

export const ROLE_LABEL: Record<number, string> = {
  1: 'Trabajador Social',
  2: 'Coordinador de área',
  3: 'Administrador',
  4: 'Superadministrador',
  5: 'Usuario',
  6: 'Psicólogo',
  7: 'Educador',
  8: 'Jurídico',
}

const V: Action[] = ['view']
const CE: Action[] = ['view', 'create', 'edit']
const CEB: Action[] = ['view', 'create', 'edit', 'deactivate']

/**
 * Matriz rol → módulo → acciones (AGENTS.md §2).
 * Editable desde la pantalla RF-10 (se guarda en el mock y en la sesión).
 */
export const MODULE_ACCESS: Record<ModuleId, Partial<Record<RoleKey, Action[]>>> = {
  dashboard: {
    superadmin: V, admin: V, coordinador: V, tsocial: V,
    psicologo: V, educador: V, juridico: V, usuario: V,
  },
  perfil: {
    superadmin: ['view', 'edit'], admin: ['view', 'edit'], coordinador: ['view', 'edit'],
    tsocial: ['view', 'edit'], psicologo: ['view', 'edit'], educador: ['view', 'edit'],
    juridico: ['view', 'edit'], usuario: ['view', 'edit'],
  },
  usuarios: { superadmin: CEB, admin: CEB },
  uzdi: {
    superadmin: CEB, admin: V, coordinador: V, tsocial: V,
    psicologo: V, educador: V, juridico: V,
  },
  perfiles: { superadmin: CEB, admin: V },
  permisos: { superadmin: CE, admin: V },
  parametros: { superadmin: CE, admin: CE },
  adolescentes: {
    superadmin: V, admin: V, coordinador: V, tsocial: CEB,
    psicologo: V, educador: V, juridico: V,
  },
  representantes: { coordinador: V, tsocial: CEB },
  'contexto-familiar': { coordinador: V, tsocial: CE, psicologo: V },
  'alertas-salud': { coordinador: V, tsocial: CE },
  fichas: { coordinador: V, psicologo: CE },
  educacion: { coordinador: V, educador: CEB },
  talleres: { coordinador: V, psicologo: CEB, educador: CEB },
  'asistencia-talleres': { coordinador: V, psicologo: CE, educador: CE },
  expedientes: {
    admin: V, coordinador: V, tsocial: V, juridico: CE,
  },
  medidas: {
    admin: V, tsocial: V, psicologo: V, educador: V, juridico: CEB,
  },
  documentos: { juridico: ['view', 'create', 'edit', 'deactivate'] },
  gdos: { admin: CEB, tsocial: V },
  catalogos: { superadmin: V, admin: CEB, tsocial: V },
  'asignacion-casos': {
    coordinador: CE, tsocial: V, psicologo: V, educador: V, juridico: V,
  },
  reportes: {
    superadmin: V, admin: V, coordinador: V, tsocial: V,
    psicologo: V, educador: V, juridico: V,
  },
  informes: { coordinador: V, tsocial: CE, psicologo: CE, juridico: CE },
  bitacora: { superadmin: V },
}

export function roleKey(tppr: number | undefined | null): RoleKey {
  return ROLE_KEY[tppr ?? ROL_USUARIO] ?? 'usuario'
}

/** Matriz por defecto del rol, derivada de MODULE_ACCESS. */
export function defaultPermissions(tppr: number | undefined | null): RolePermissions {
  const key = roleKey(tppr)
  const out: RolePermissions = {}
  for (const module of Object.keys(MODULE_ACCESS) as ModuleId[]) {
    const actions = MODULE_ACCESS[module][key]
    if (actions && actions.length) out[module] = [...actions]
  }
  return out
}

/** ¿El rol puede ejecutar `action` en `module`? */
export function can(
  module: ModuleId,
  action: Action,
  tppr: number | undefined | null,
  permisos?: RolePermissions,
): boolean {
  const matrix = permisos ?? defaultPermissions(tppr)
  return matrix[module]?.includes(action) ?? false
}

/** ¿El rol puede ver el módulo (y por tanto su enlace y su ruta)? */
export function canAccess(
  module: ModuleId,
  tppr: number | undefined | null,
  permisos?: RolePermissions,
): boolean {
  const matrix = permisos ?? defaultPermissions(tppr)
  const actions = matrix[module]
  return !!actions && actions.length > 0
}

/** Compatibilidad con el código anterior; usar can/canAccess en código nuevo. */
export function levelFor(tppr: number | undefined): number {
  const key = roleKey(tppr)
  if (key === 'superadmin' || key === 'admin') return 3
  if (key === 'coordinador') return 2
  return 1
}

/** Módulos que nunca deben exponerse en el menú salvo que el rol los tenga. */
export const MODULOS_SENSIBLES: ModuleId[] = [
  'fichas', 'alertas-salud', 'contexto-familiar', 'documentos',
]
