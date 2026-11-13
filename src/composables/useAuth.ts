import { ref, computed } from 'vue'

function tokenCaducado(value: string): boolean {
  try {
    const middle = value.split('.')[1]
    if (!middle) return false // La sesión demo no contiene claims JWT.
    const payload = JSON.parse(atob(middle.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number }
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()
  } catch {
    return false // Es el backend, no el contenido de localStorage, quien valida el token.
  }
}

function tokenAlInicio(): string {
  const stored = localStorage.getItem('uzdi_token') ?? ''
  // El backend real usa JWT. En producción se descartan sesiones opacas
  // heredadas de cualquier modo de demostración anterior.
  const esTokenNoJwt = import.meta.env.VITE_USE_MOCK !== 'true' &&
    !/^[^.]+\.[^.]+\.[^.]+$/.test(stored)
  if (!stored || esTokenNoJwt || tokenCaducado(stored)) {
    localStorage.removeItem('uzdi_token')
    localStorage.removeItem('uzdi_user')
    localStorage.removeItem('uzdi_permisos')
    return ''
  }
  return stored
}

const token = ref<string>(tokenAlInicio())

function usuarioGuardado(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem('uzdi_user')
    return raw ? JSON.parse(raw) as Record<string, unknown> : null
  } catch {
    localStorage.removeItem('uzdi_user')
    return null
  }
}

const user = ref<Record<string, unknown> | null>(usuarioGuardado())

function sinSecretos(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([key]) =>
    !/password|contrasena|contraseña|secret|token|hash|salt/i.test(key),
  ))
}

export function useAuth() {
  const isLoggedIn = computed(() => !!token.value && !tokenCaducado(token.value))

  function setSession(newToken: string, newUser: Record<string, unknown>) {
    const usuarioSeguro = sinSecretos(newUser)
    token.value = newToken
    user.value = usuarioSeguro
    localStorage.setItem('uzdi_token', newToken)
    localStorage.setItem('uzdi_user', JSON.stringify(usuarioSeguro))
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('uzdi_token')
    localStorage.removeItem('uzdi_user')
    localStorage.removeItem('uzdi_permisos')
  }

  return { token, user, isLoggedIn, setSession, logout }
}
