/** Colecciones REST: acepta arreglos y paginación común de APIs Nest/Express. */
export function listaDe<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (!value || typeof value !== 'object') return []
  const obj = value as Record<string, unknown>
  for (const key of ['items', 'results', 'rows', 'registros', 'data']) {
    if (Array.isArray(obj[key])) return obj[key] as T[]
  }
  return []
}

export function mensajeErrorApi(error: unknown, fallback: string): string {
  const e = error as { response?: { data?: { message?: string | string[]; error?: string }; status?: number }; message?: string; code?: string }
  const raw = e?.response?.data?.message
  if (typeof raw === 'string' && raw.trim()) return raw
  if (Array.isArray(raw) && raw.length) return raw.join('. ')
  if (e?.code === 'DELETE_DISABLED' && e.message) return e.message
  if (e?.response?.status === 400 || e?.response?.status === 422) return 'Revise los datos enviados e intente nuevamente.'
  if (e?.response?.status === 401) return 'La sesión no es válida o las credenciales son incorrectas.'
  if (e?.response?.status === 403) return 'No tiene autorización para realizar esta acción.'
  if (e?.response?.status === 409) return 'Ya existe un registro con esos datos.'
  if (e?.response?.status === 404) return 'Esta función todavía no está disponible en el backend.'
  if (e?.response?.status === 429) return 'Demasiadas solicitudes. Intente nuevamente más tarde.'
  if ((e?.response?.status ?? 0) >= 500) return 'El servidor no pudo completar la operación. Intente nuevamente más tarde.'
  if (e?.code === 'ECONNABORTED') return 'El servidor tardó demasiado en responder. Vuelva a intentarlo.'
  if (e?.code === 'ERR_NETWORK') return 'No se pudo acceder al servidor. Compruebe la conexión y la configuración CORS.'
  return fallback
}
