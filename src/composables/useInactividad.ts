import { onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PENDIENTES } from '../config/pendientes'
import { leerSeguridad } from '../config/seguridad'
import { useAuth } from './useAuth'
import { useToast } from './useToast'

const EVENTOS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const

/**
 * Cierre de sesión por inactividad (RNF-04).
 * El tiempo se lee de los Parámetros de seguridad; el aviso previo dura
 * `PENDIENTES.avisoInactividadSeg` segundos (por definir con el SNAI).
 */
export function useInactividad() {
  const router = useRouter()
  const toast = useToast()
  const { logout } = useAuth()

  const advertencia = ref(false)
  const segundosRestantes = ref<number>(PENDIENTES.avisoInactividadSeg)
  let activo = false
  let avisoTimer: ReturnType<typeof setTimeout> | undefined
  let cierreTimer: ReturnType<typeof setTimeout> | undefined
  let cuentaTimer: ReturnType<typeof setInterval> | undefined
  let ultimoReinicio = 0

  function limpiarTemporizadores(): void {
    if (avisoTimer) clearTimeout(avisoTimer)
    if (cierreTimer) clearTimeout(cierreTimer)
    if (cuentaTimer) clearInterval(cuentaTimer)
    avisoTimer = undefined
    cierreTimer = undefined
    cuentaTimer = undefined
  }

  function cerrarPorInactividad(): void {
    detener()
    logout()
    toast.warn('La sesión se cerró automáticamente por inactividad.')
    router.push('/login')
  }

  function programar(): void {
    limpiarTemporizadores()
    if (!activo) return

    const totalMs = Math.max(1, leerSeguridad().sesionTimeout) * 60_000
    const avisoMs = Math.max(0, totalMs - PENDIENTES.avisoInactividadSeg * 1000)

    avisoTimer = setTimeout(() => {
      advertencia.value = true
      segundosRestantes.value = PENDIENTES.avisoInactividadSeg
      cuentaTimer = setInterval(() => {
        segundosRestantes.value = Math.max(0, segundosRestantes.value - 1)
      }, 1000)
    }, avisoMs)

    cierreTimer = setTimeout(cerrarPorInactividad, totalMs)
  }

  function alHaberActividad(): void {
    if (!activo || advertencia.value) return
    const ahora = Date.now()
    if (ahora - ultimoReinicio < 1000) return
    ultimoReinicio = ahora
    programar()
  }

  function seguirConectado(): void {
    advertencia.value = false
    programar()
  }

  function iniciar(): void {
    if (activo) return
    activo = true
    EVENTOS.forEach((evento) => window.addEventListener(evento, alHaberActividad, { passive: true }))
    programar()
  }

  function detener(): void {
    activo = false
    EVENTOS.forEach((evento) => window.removeEventListener(evento, alHaberActividad))
    limpiarTemporizadores()
    advertencia.value = false
    segundosRestantes.value = PENDIENTES.avisoInactividadSeg
  }

  onUnmounted(detener)

  return {
    advertencia,
    segundosRestantes,
    iniciar,
    detener,
    seguirConectado,
    cerrarAhora: cerrarPorInactividad,
  }
}
