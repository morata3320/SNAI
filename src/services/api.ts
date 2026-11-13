import axios from 'axios'
import { USE_MOCK } from './backend-contract'

/**
 * Se acepta tanto VITE_API_URL (incluye /api/v1) como la antigua
 * VITE_API_BASE_URL (dominio raíz). Evita duplicar /api/v1.
 */
const configuredUrl = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'https://uzdi-backend-api.onrender.com/api/v1'
).trim().replace(/\/+$/, '')

export const API_URL = /\/api\/v1$/i.test(configuredUrl)
  ? configuredUrl
  : `${configuredUrl}/api/v1`

const api = axios.create({
  baseURL: API_URL,
  // El free tier de Render puede tardar varias decenas de segundos en reactivarse.
  timeout: 60_000,
})

// El bundle de producción no carga datos ni lógica del simulador.
// La condición usa import.meta.env directamente para que Rollup elimine por
// completo el chunk del mock cuando VITE_USE_MOCK=false.
if (import.meta.env.VITE_USE_MOCK === 'true') {
  api.defaults.adapter = (config) => import('./mock/adapter').then(({ mockAdapter }) => mockAdapter(config))
}

api.interceptors.request.use((config) => {
  // Los DELETE del prototipo se muestran como «baja lógica». Antes de habilitarlos
  // se debe confirmar que el backend NO borra registros ni historial físicamente.
  if (!USE_MOCK && config.method?.toLowerCase() === 'delete' &&
      import.meta.env.VITE_ENABLE_DELETE !== 'true') {
    return Promise.reject(Object.assign(new Error(
      'La baja se ha bloqueado preventivamente. Confirme con backend que DELETE conserva el historial antes de activar VITE_ENABLE_DELETE=true.'
    ), { code: 'DELETE_DISABLED' }))
  }
  const token = localStorage.getItem('uzdi_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/**
 * El servidor SNAI devuelve {ok, message, data, timestamp}, mientras que
 * las vistas originales esperan directamente `response.data = registro | []`.
 * El adaptador conserva el contrato de Axios y evita modificar cada pantalla.
 */
api.interceptors.response.use(
  (response) => {
    if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
      return response
    }
    const body = response.data
    if (body && typeof body === 'object' && !Array.isArray(body) && typeof body.ok === 'boolean') {
      if (!body.ok) {
        return Promise.reject(Object.assign(new Error(body.message || 'La operación no pudo completarse.'), {
          response: { ...response, data: body },
          config: response.config,
        }))
      }
      response.data = body.data
    }
    return response
  },
  (error) => {
    const isLogin = String(error.config?.url ?? '').includes('/auth/login')
    if (error.response?.status === 401 && !isLogin) {
      localStorage.removeItem('uzdi_token')
      localStorage.removeItem('uzdi_user')
      localStorage.removeItem('uzdi_permisos')
      const base = import.meta.env.BASE_URL || '/'
      window.location.assign(import.meta.env.VITE_ROUTER_MODE === 'hash'
        ? `${base}#/login`
        : `${base.replace(/\/$/, '')}/login`)
    }
    return Promise.reject(error)
  },
)

export default api
