# UZDI/SNAI — Fase 2: preparación del despliegue autónomo y pruebas reales no destructivas

## Contexto verificado
- Código local actual: la carpeta abierta en VS Code `UZDI_FRONT_SNAI_CONECTADO` (es la versión que ya modificó el agente; **no** volver al ZIP antiguo).
- Frontend: Vue 3 + TypeScript + Vite 8. Backend: `https://uzdi-backend-api.onrender.com/api/v1`.
- Documentación: `https://uzdi-backend-api.onrender.com/api/docs`.
- Repositorio original: `https://github.com/jscrash22/UZDI_FRONT_SNAI`; la cuenta conectada que se pudo consultar tiene permiso de lectura, **no de push**.
- El workflow público original de GitHub Pages todavía compila con `VITE_USE_MOCK=true`. La copia integrada anterior de nuestro proyecto lo cambia a `false`; verificar la versión local más reciente.
- El agente anterior informó: OpenAPI 63 rutas, 141 operaciones, 30 rutas frontend confirmadas, typecheck/build/test:api correctos; falta validación con cuenta real. Estas son afirmaciones del informe anterior, **volver a verificarlas**, no dar por hecho que los flujos autenticados funcionan.
- Los manuales preliminares de 6 nov describen usuarios y datos simulados. Las credenciales reales no están confirmadas; no probar combinaciones de usuarios/contraseñas ni evadir autenticación.

## Tu misión como agente de VS Code
Eres un ingeniero senior frontend/devops. Trabaja en el **workspace ya abierto**, donde está la versión más reciente del frontend integrado; ejecuta comandos y modifica archivos. No inicies otro proyecto Vue, no reemplaces el trabajo actual con el ZIP previo y no publiques contenido protegido. Avanza de forma autónoma en todo lo no destructivo. Antes de cualquier push verifica el destino; **jamás** hagas `git push --force`, y no modifiques el repositorio de otra persona sin autorización.

### Fase A — Auditoría del estado actual
1. Lee `AGENTS.md`, `package.json`, `README.md`, `INTEGRACION_RENDER.md` y `docs/INTEGRACION_BACKEND_REAL.md` si existe.
2. Ejecuta `git status --short`, `git remote -v`, `git branch --show-current` (si no hay `.git`, déjalo registrado; no hagas `git init` para sobrescribir upstream).
3. Comprueba `.env`, `.env.production` y `.github/workflows/deploy-pages.yml`. En build real debe usarse `VITE_USE_MOCK=false`, URL Render, `VITE_ENABLE_DELETE=false` y en GitHub Pages modo `hash`.
4. Asegura que Vite `base` coincida con el nombre del repositorio destino: si el fork se llama `UZDI_FRONT_SNAI`, `VITE_BASE=/UZDI_FRONT_SNAI/`; si cambia nombre, actualiza base y URL esperada.
5. Audita que ni datos ficticios ni elementos demo aparezcan como información real. Los módulos sin endpoints deben estar ocultos o claramente indisponibles.
6. Verifica que no haya contraseñas, tokens, JWT, cookies ni datos personales reales en commits, `dist`, logs, capturas o documentación. No imprimas respuestas de datos de adolescentes.

### Fase B — Pruebas públicas de red sin cuenta
1. Ejecuta `npm ci`, `npm run typecheck`, `npm run build`, `npm run test:api` y `npm run audit:openapi` **si existe en package.json**.
2. Consulta GET `/api/v1` y la especificación OpenAPI: registra código HTTP y campos de estructura, nunca registros personales.
3. Comprueba CORS para ambos orígenes `http://localhost:5174` y `https://jscrash22.github.io` usando dos `OPTIONS` de preflight: para `POST /api/v1/auth/login` con `Access-Control-Request-Headers: content-type`, y para `GET /api/v1/users` con `Access-Control-Request-Headers: authorization`. Si backend responde un preflight que el navegador rechaza, documenta el error y no simules que CORS funciona.
4. Comprueba que todas las rutas apunten a la base sin duplicar `/api/v1/api/v1`.
5. Verifica errores 401/403/404 en el frontend de forma segura; no intentes acceder sin autorización a datos protegidos.
6. Si Render está dormido, usa timeout razonable sin loops agresivos. Reintenta solo una vez.
7. Si la red de la terminal no permite salir, informa limitación y da los comandos para repetir en mi PC; no inventes pruebas exitosas.

### Fase C — GitHub y versión publicable
1. Comprueba si esta carpeta tiene historial Git. Si no lo tiene, usa una copia temporal o una nueva carpeta al lado para clonar el repositorio original o mi fork, conservando el código integrado actual. Nunca copies ni borres `.git` al trasladar archivos.
2. El repositorio `jscrash22/UZDI_FRONT_SNAI` debe tratarse como **upstream solo lectura** salvo que se comprueben permisos de escritura de mi cuenta. Si no puedo hacer push, prepara instrucciones concretas para crear un fork desde la interfaz de GitHub, clonarlo, copiar cambios seguros del workspace y crear rama `integracion-render`.
3. No copies `node_modules`, `dist`, `.env`, `*.local`, logs ni secretos al repositorio. Si necesitas variables de ejemplo, usa `.env.example` sin secretos.
4. Prepara workflow GitHub Actions de Vite (`npm ci` y `npm run build`) con `VITE_USE_MOCK=false`, `VITE_API_URL=https://uzdi-backend-api.onrender.com/api/v1`, `VITE_ENABLE_DELETE=false`, `VITE_ROUTER_MODE=hash` y `VITE_BASE` acorde al nombre del repo; publicar solo `dist`.
5. Verifica permisos `contents: read`, `pages: write`, `id-token: write`, el artifact y las dependencias `needs` de deploy. Respeta el workflow existente si ya es correcto.
6. Deja listo el commit en una rama del repositorio propio/fork. Si hay credenciales y autorización explícita para publicar en el **fork mío**, podrás hacer push a mi fork; nunca a `upstream/main`, nunca `--force`, y nunca mezcles secretos.
7. Una vez que el fork esté desplegado, prueba la URL **de ese fork**. No afirmes que se actualizó `https://jscrash22.github.io/UZDI_FRONT_SNAI/` si realmente se publicó en otra cuenta.

### Fase D — Validación funcional sin credenciales
1. La pantalla de login debe poder abrirse, pero no debe permitir ingresar con credenciales simuladas en el despliegue real.
2. Muestra en UI estados de carga, backend caído, credenciales faltantes, sesión expirada y error de red. No muestres datos mock como reales.
3. Un `GET /api/v1` que dé 200 no equivale a login válido ni a CRUD válido. Diferencia en documentación las pruebas de contrato, compilación, integración anónima y pruebas autenticadas pendientes.
4. Conserva protegidos expedientes, usuarios, adolescentes y reportes con JWT y RBAC. No pruebes POST/PATCH/DELETE de registros reales.
5. Opcional: crear un panel de diagnóstico en desarrollo (NO en producción) que muestre solo estado HTTP y CORS, sin credenciales ni payloads.

### Fase E — Entregables obligatorios
Crea `docs/FASE_2_DESPLIEGUE.md` con: (a) estado del Git local y remotos; (b) resultados reales por comando; (c) listado de archivos modificados; (d) CORS por origen y preflight; (e) estado real del workflow y URL del despliegue si se publicó; (f) matriz `Implementado / Probado sin login / Pendiente por credenciales / Bloqueado por backend` para módulos principales; (g) ruta exacta para lanzar la versión en vivo de forma segura; (h) errores pendientes.

Criterios de éxito: `npm run typecheck` y `npm run build` correctos; deploy real configurado contra Render con mock desactivado; rama/fork preparado sin modificar `upstream/main`; pruebas públicas claras y sin información personal. Sé transparente: el login y CRUD no pueden marcarse verificados sin una cuenta válida autorizada.

**Empieza inspeccionando el workspace actual, no solicitando otra descarga del ZIP.**
