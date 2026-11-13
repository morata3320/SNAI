// Parámetros de seguridad y notificaciones editables desde Parámetros (RNF-03/04).
// Se guardan en localStorage para que login e inactividad funcionen antes de autenticarse.
import { PENDIENTES } from './pendientes'

export interface ParametrosSeguridad {
  sesionTimeout: number
  intentosMaximos: number
  cambioPassDias: number
  duracionBloqueoMin: number
}

export interface ParametrosNotificaciones {
  diasAnticipacionVencimiento: number
  correoAlertas: string
  emailActivo: boolean
}

const LS_SEG = 'uzdi_params_seg'
const LS_NOTIF = 'uzdi_params_notif'

export const SEGURIDAD_DEFAULT: ParametrosSeguridad = {
  sesionTimeout: PENDIENTES.inactividadMin,
  intentosMaximos: PENDIENTES.intentosLogin,
  cambioPassDias: PENDIENTES.caducidadClaveDias,
  duracionBloqueoMin: PENDIENTES.duracionBloqueoMin,
}

export const NOTIFICACIONES_DEFAULT: ParametrosNotificaciones = {
  diasAnticipacionVencimiento: PENDIENTES.diasAnticipacion,
  correoAlertas: 'alertas@uzdi.demo.ec',
  emailActivo: true,
}

function leer<T extends object>(clave: string, defecto: T): T {
  try {
    const raw = localStorage.getItem(clave)
    if (!raw) return { ...defecto }
    return { ...defecto, ...(JSON.parse(raw) as Partial<T>) }
  } catch {
    return { ...defecto }
  }
}

export function leerSeguridad(): ParametrosSeguridad {
  return leer(LS_SEG, SEGURIDAD_DEFAULT)
}

export function guardarSeguridad(valor: ParametrosSeguridad): void {
  localStorage.setItem(LS_SEG, JSON.stringify(valor))
}

export function leerNotificaciones(): ParametrosNotificaciones {
  return leer(LS_NOTIF, NOTIFICACIONES_DEFAULT)
}

export function guardarNotificaciones(valor: ParametrosNotificaciones): void {
  localStorage.setItem(LS_NOTIF, JSON.stringify(valor))
}
