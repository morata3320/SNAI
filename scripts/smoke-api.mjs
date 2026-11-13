/**
 * Pruebas NO destructivas: solamente Health, Login y GET.
 * No imprime contraseñas, tokens, cédulas ni datos personales.
 * Uso CMD: set UZDI_LOGIN=admin && set UZDI_PASSWORD=... && npm run test:api
 */
import { existsSync } from 'node:fs'

if (existsSync('.env') && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile('.env')
}
const configured = (process.env.VITE_API_URL || process.env.VITE_API_BASE_URL ||
  'https://uzdi-backend-api.onrender.com/api/v1').replace(/\/+$/, '')
const base = /\/api\/v1$/i.test(configured) ? configured : `${configured}/api/v1`
const origin = base.replace(/\/api\/v1$/i, '')

async function call(method, path, token, body) {
  const ctl = new AbortController()
  const timeout = setTimeout(() => ctl.abort(), 65_000)
  try {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctl.signal,
    })
    const contentType = res.headers.get('content-type') ?? ''
    const payload = contentType.includes('json') ? await res.json().catch(() => null) : null
    const value = payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload
    const cantidad = Array.isArray(value) ? ` · ${value.length} registros` : ''
    console.log(`${res.ok ? 'OK ' : 'ERR'} ${String(res.status).padStart(3)} ${method.padEnd(4)} ${path}${cantidad}`)
    return { res, payload, value }
  } catch (err) {
    console.log(`ERR red ${method} ${path}: ${err instanceof Error ? err.name : 'Error desconocido'}`)
    return null
  } finally {
    clearTimeout(timeout)
  }
}

console.log(`API destino: ${base}`)
console.log('Sin escrituras ni cambios de datos. Primera respuesta de Render puede tardar.\n')
await call('GET', '')

const openapi = await fetch(`${origin}/api/docs-json`).then(async (res) => ({
  ok: res.ok,
  status: res.status,
  body: res.ok ? await res.json().catch(() => null) : null,
})).catch(() => null)
if (openapi?.ok && openapi.body?.paths) {
  const operaciones = Object.values(openapi.body.paths)
    .reduce((total, item) => total + Object.keys(item).filter((key) =>
      ['get', 'post', 'patch', 'put', 'delete'].includes(key)).length, 0)
  console.log(`OK  ${openapi.status} GET  /api/docs-json · ${operaciones} operaciones publicadas`)
} else {
  console.log(`ERR ${openapi?.status ?? 'red'} GET  /api/docs-json`)
  process.exitCode = 1
}

const login = process.env.UZDI_LOGIN
const password = process.env.UZDI_PASSWORD
if (!login || !password) {
  console.log('\nSin UZDI_LOGIN y UZDI_PASSWORD: solo se comprobó Health. Nada se ha autenticado.')
} else {
  const result = await call('POST', '/auth/login', '', { login, password })
  if (!result?.res.ok) {
    console.log('Login fallido. Revise las credenciales autorizadas y la respuesta de Swagger.')
    process.exitCode = 1
  } else {
    const body = result.value && typeof result.value === 'object' ? result.value : {}
    const tokens = body.tokens && typeof body.tokens === 'object' ? body.tokens : {}
    const token = body.token ?? body.access_token ?? body.accessToken ?? body.jwt ??
      tokens.access_token ?? tokens.accessToken
    if (typeof token !== 'string' || !token) {
      console.log('La respuesta de login no contiene un token reconocido; revisar contrato de autenticación.')
      process.exitCode = 1
    } else {
      console.log('Token recibido (valor oculto). Comprobando endpoints de solo lectura…\n')
      const rutas = [
        '/users', '/provincia', '/canton', '/uzdi', '/perfil', '/permiso',
        '/nacionalidad', '/estado-civil', '/etnia', '/gdo', '/infraccion',
        '/medida-socioeducativa', '/adolescente', '/expediente', '/medida-expediente',
        '/representante', '/adolescente-representante', '/taller', '/asistencia-taller',
        '/tipo-documento', '/documento-expediente', '/historial',
        '/reportes/uzdi/adolescentes', '/reportes/expedientes/medidas',
      ]
      for (const ruta of rutas) await call('GET', ruta, token)
    }
  }
}
