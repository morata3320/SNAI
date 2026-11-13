import { computed, ref } from 'vue'
import api from '../services/api'
import { USE_MOCK, moduloDisponibleEnBackend } from '../services/backend-contract'
import { useAuth } from './useAuth'
import {
  ROL_USUARIO,
  can,
  canAccess,
  defaultPermissions,
  type Action,
  type ModuleId,
  type RolePermissions,
} from '../router/access'

const LS_PERMISOS = 'uzdi_permisos'

interface Snapshot {
  rol: number
  permisos: RolePermissions
}

function leerSnapshot(): Snapshot | null {
  try {
    const raw = localStorage.getItem(LS_PERMISOS)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Snapshot>
    if (typeof parsed.rol !== 'number' || !parsed.permisos || typeof parsed.permisos !== 'object') {
      return null
    }
    return { rol: parsed.rol, permisos: parsed.permisos as RolePermissions }
  } catch {
    return null
  }
}

function guardarSnapshot(snapshot: Snapshot): void {
  localStorage.setItem(LS_PERMISOS, JSON.stringify(snapshot))
}

const snapshot = ref<Snapshot | null>(leerSnapshot())
const cargando = ref(false)
const error = ref<string | null>(null)
const ACCIONES_VALIDAS = new Set<Action>(['view', 'create', 'edit', 'deactivate'])

function permisosDeSesion(value: unknown): RolePermissions | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const resultado: RolePermissions = {}
  let reconocidos = 0
  for (const [module, actions] of Object.entries(value as Record<string, unknown>)) {
    if (!Array.isArray(actions)) continue
    const validas = actions.filter((action): action is Action =>
      typeof action === 'string' && ACCIONES_VALIDAS.has(action as Action),
    )
    if (validas.length) {
      resultado[module as ModuleId] = validas
      reconocidos++
    }
  }
  return reconocidos ? resultado : null
}

/** Permisos vigentes para el guard: snapshot de la sesión o matriz por defecto. */
export function permisosVigentes(tppr: number | undefined | null): RolePermissions {
  const actual = tppr ?? ROL_USUARIO
  const snap = snapshot.value
  if (snap && snap.rol === actual) return snap.permisos
  return defaultPermissions(actual)
}

/**
 * Permisos del usuario en sesión. Los cambios hechos en RF-10 se aplican
 * en el siguiente ingreso (se cargan al iniciar sesión y quedan en el snapshot).
 */
export function usePermisos() {
  const { user } = useAuth()

  const tppr = computed(() => (user.value?.['tppr_id'] as number) ?? ROL_USUARIO)
  const permisos = computed<RolePermissions>(() => permisosVigentes(tppr.value))

  function puede(module: ModuleId, action: Action): boolean {
    return can(module, action, tppr.value, permisos.value)
  }

  function visible(module: ModuleId): boolean {
    return moduloDisponibleEnBackend(module) && canAccess(module, tppr.value, permisos.value)
  }

  /** Carga la matriz vigente del rol desde /permisos/:rol y la fija para esta sesión. */
  async function cargar(): Promise<void> {
    cargando.value = true
    error.value = null
    const rol = tppr.value
    try {
      // Render publica /permiso (registros individuales), no la matriz
      // /permisos/:rol del simulador. Hasta que el DTO documente su forma,
      // se usa la matriz local sin inventar una conversión.
      if (!USE_MOCK) {
        const recibidos = permisosDeSesion(user.value?.['permisos'])
        snapshot.value = { rol, permisos: recibidos ?? defaultPermissions(rol) }
        guardarSnapshot(snapshot.value)
        return
      }
      const { data } = await api.get<RolePermissions>(`/permisos/${rol}`)
      snapshot.value = { rol, permisos: data }
      guardarSnapshot(snapshot.value)
    } catch {
      const porDefecto = defaultPermissions(rol)
      snapshot.value = { rol, permisos: porDefecto }
      guardarSnapshot(snapshot.value)
      error.value = 'No se pudo cargar la matriz de permisos; se usó la configuración por defecto.'
    } finally {
      cargando.value = false
    }
  }

  function limpiar(): void {
    snapshot.value = null
    localStorage.removeItem(LS_PERMISOS)
  }

  return {
    tppr,
    permisos,
    cargando,
    error,
    puede,
    visible,
    can: puede,
    canAccess: visible,
    moduleVisible: visible,
    cargar,
    limpiar,
  }
}
