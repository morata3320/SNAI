/**
 * UZDI/SNAI — verificación pública de Render y CORS (solo lectura).
 * Uso: node uzdi-public-check-v2.mjs
 * Requiere Node.js 18+; no necesita npm ni credenciales.
 */
const base = (process.env.VITE_API_URL || 'https://uzdi-backend-api.onrender.com/api/v1').replace(/\/+$/, '');
const docs = new URL('/api/docs-json', base).toString();
const origins = ['http://localhost:5174', 'https://morata3320.github.io'];
const limitMs = 60000; // Render Free puede tardar en despertar.

async function request(label, url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(limitMs),
    });
    const allowOrigin = response.headers.get('access-control-allow-origin');
    const allowMethods = response.headers.get('access-control-allow-methods');
    const allowHeaders = response.headers.get('access-control-allow-headers');
    console.log(`\n${label}: HTTP ${response.status}`);
    console.log(`  URL: ${url}`);
    if (options.headers?.Origin) {
      console.log(`  Origin enviado: ${options.headers.Origin}`);
      console.log(`  Allow-Origin: ${allowOrigin ?? '(no presente)'}`);
      console.log(`  Allow-Methods: ${allowMethods ?? '(no presente)'}`);
      console.log(`  Allow-Headers: ${allowHeaders ?? '(no presente)'}`);
      const corsOriginOk = allowOrigin === '*' || allowOrigin === options.headers.Origin;
      const methodOk = response.ok;
      console.log(`  CORS preflight: ${corsOriginOk && methodOk ? 'APARENTA PERMITIDO' : 'REVISAR'}`);
    } else if (response.ok) {
      const data = await response.json().catch(() => null);
      if (data && typeof data === 'object') {
        console.log(`  JSON recibido: ${Object.keys(data).join(', ')}`);
      }
    }
    return response.ok;
  } catch (error) {
    console.log(`\n${label}: ERROR ${error?.name ?? 'red'} — ${error?.message ?? error}`);
    return false;
  }
}

console.log('UZDI/SNAI — prueba SIN escrituras, login ni datos personales');
console.log(`Backend: ${base}`);
const health = await request('HEALTH', base);
const openapi = await request('OPENAPI', docs);
for (const origin of origins) {
  await request(`CORS LOGIN (${origin})`, `${base}/auth/login`, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
  });
  await request(`CORS JWT (${origin})`, `${base}/users`, {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'authorization',
    },
  });
}
console.log(`\nResumen: Health ${health ? 'OK' : 'FALLÓ'} | OpenAPI ${openapi ? 'OK' : 'REVISAR'}`);
console.log('NOTA: Esto NO inicia sesión ni demuestra los CRUD; requieren credenciales de prueba autorizadas.');
