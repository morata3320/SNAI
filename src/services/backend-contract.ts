import type { ModuleId } from '../router/access'

/**
 * Rutas publicadas por OpenAPI 2.0 de UZDI/SNAI (consultado el 2026-11-12).
 * Mantener el contrato HTTP en la capa de servicios evita que las vistas
 * dependan de nombres del backend.
 */
export const ENDPOINTS = {
  health: '',
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    changePassword: '/auth/change-password',
  },
  users: '/users',
  provincia: '/provincia',
  canton: '/canton',
  uzdi: '/uzdi',
  perfil: '/perfil',
  accion: '/accion',
  permiso: '/permiso',
  persona: '/persona',
  sesion: '/sesion',
  historial: '/historial',
  nacionalidad: '/nacionalidad',
  estadoCivil: '/estado-civil',
  etnia: '/etnia',
  gdo: '/gdo',
  infraccion: '/infraccion',
  medidaSocioeducativa: '/medida-socioeducativa',
  adolescente: '/adolescente',
  expediente: '/expediente',
  medidaExpediente: '/medida-expediente',
  tipoParentesco: '/tipo-parentesco',
  representante: '/representante',
  adolescenteRepresentante: '/adolescente-representante',
  taller: '/taller',
  asistenciaTaller: '/asistencia-taller',
  tipoDocumento: '/tipo-documento',
  documentoExpediente: '/documento-expediente',
  reportes: {
    adolescentes: '/reportes/uzdi/adolescentes',
    expedientesMedidas: '/reportes/expedientes/medidas',
    excel: '/reportes/export/excel',
    pdf: '/reportes/export/pdf',
  },
} as const

/**
 * Módulos con al menos un endpoint confirmado. En demo se conservan todos los
 * RF; contra Render se ocultan los que solo existen en el mock para no mostrar
 * información simulada como si proviniera del sistema institucional.
 */
const MODULOS_RENDER = new Set<ModuleId>([
  'dashboard',
  'perfil',
  'usuarios',
  'uzdi',
  'perfiles',
  'permisos',
  'adolescentes',
  'representantes',
  'talleres',
  'asistencia-talleres',
  'expedientes',
  'medidas',
  'documentos',
  'gdos',
  'catalogos',
  'reportes',
  'bitacora',
])

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export function moduloDisponibleEnBackend(module: ModuleId): boolean {
  return USE_MOCK || MODULOS_RENDER.has(module)
}

