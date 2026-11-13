const docsUrl = 'https://uzdi-backend-api.onrender.com/api/docs-json'

const rutasUsadas = [
  '/api/v1/auth/login', '/api/v1/auth/logout', '/api/v1/auth/change-password',
  '/api/v1/users', '/api/v1/provincia', '/api/v1/canton', '/api/v1/uzdi',
  '/api/v1/perfil', '/api/v1/permiso', '/api/v1/historial',
  '/api/v1/nacionalidad', '/api/v1/estado-civil', '/api/v1/etnia', '/api/v1/gdo',
  '/api/v1/infraccion', '/api/v1/medida-socioeducativa', '/api/v1/adolescente',
  '/api/v1/expediente', '/api/v1/medida-expediente', '/api/v1/tipo-parentesco',
  '/api/v1/representante', '/api/v1/adolescente-representante', '/api/v1/taller',
  '/api/v1/asistencia-taller', '/api/v1/tipo-documento', '/api/v1/documento-expediente',
  '/api/v1/reportes/uzdi/adolescentes', '/api/v1/reportes/expedientes/medidas',
  '/api/v1/reportes/export/excel', '/api/v1/reportes/export/pdf',
]

const response = await fetch(docsUrl)
if (!response.ok) throw new Error(`OpenAPI respondió HTTP ${response.status}`)
const spec = await response.json()
const paths = spec.paths && typeof spec.paths === 'object' ? spec.paths : {}
const schemas = spec.components?.schemas && typeof spec.components.schemas === 'object'
  ? spec.components.schemas
  : {}

const operaciones = Object.values(paths).reduce((total, path) => total +
  Object.keys(path).filter((method) => ['get', 'post', 'patch', 'put', 'delete'].includes(method)).length, 0)
const esquemasVacios = Object.entries(schemas)
  .filter(([, schema]) => !schema.properties || Object.keys(schema.properties).length === 0)
  .map(([name]) => name)
const ausentes = rutasUsadas.filter((path) => !paths[path])

console.log(`OpenAPI: ${spec.info?.title ?? 'sin título'} ${spec.info?.version ?? ''}`.trim())
console.log(`Rutas: ${Object.keys(paths).length} · Operaciones: ${operaciones} · Esquemas: ${Object.keys(schemas).length}`)
console.log(`Rutas del frontend confirmadas: ${rutasUsadas.length - ausentes.length}/${rutasUsadas.length}`)
console.log(`DTO sin propiedades documentadas: ${esquemasVacios.length}/${Object.keys(schemas).length}`)

if (ausentes.length) {
  console.error(`Rutas ausentes: ${ausentes.join(', ')}`)
  process.exitCode = 1
}

