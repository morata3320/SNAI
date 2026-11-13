# UZDI SNAI — Integración Frontend ↔ Backend Render

> Auditoría actualizada: consulte `docs/INTEGRACION_BACKEND_REAL.md`. El OpenAPI JSON ya está disponible y confirmó 63 rutas y 141 operaciones; sus 55 esquemas DTO siguen vacíos.

**Fecha:** 12 de noviembre de 2026  
**Frontend:** Vue 3 + Vite 8 + TypeScript + Axios  
**Backend:** https://uzdi-backend-api.onrender.com/api/v1  
**Swagger:** https://uzdi-backend-api.onrender.com/api/docs

## 1. Diagnóstico del proyecto entregado

El frontend ya tenía diseño, formularios, navegación por rol, servicios HTTP y un simulador (`src/services/mock`). El archivo original `.env` estaba configurado con `VITE_API_BASE_URL=http://localhost:3000` y `VITE_USE_MOCK=true`: por tanto, sus pantallas NO consumían Render. La CI de GitHub Pages también forzaba `VITE_USE_MOCK=true`, incluso si se cambiaba el `.env` local. Se corrigieron ambos puntos.

Problemas de contrato identificados:

1. El nuevo backend anuncia `{ok:boolean,message:string,data:...,timestamp?:string}`, y las vistas esperaban respuestas directas o wrappers heredados.
2. Algunos endpoints de listado pueden devolver paginación y no un arreglo directo.
3. La pantalla login esperaba específicamente `{token,user}` sin wrapper, lo que impedía el inicio de sesión con otras convenciones de tokens.
4. Un backend suspendido en Render Free puede exceder el tiempo de espera HTTP predeterminado.
5. El frontend decía «desactivar» al hacer HTTP DELETE; no puede asumirse baja lógica sin confirmar contrato backend.
6. Reportes del prototipo exportaban PDF por impresión y CSV local, mientras Swagger ofrece descargas institucionales Excel y PDF.
7. El cierre de sesión solo limpiaba estado local, sin intentar invalidar la sesión del servidor.

## 2. Cambios realizados

| Archivo | Cambio |
|---|---|
| `.env`, `.env.example` | Se apunta a Render, se apaga mock y se protege DELETE. |
| `.github/workflows/deploy-pages.yml` | El build de GitHub Pages deja de forzar mock y utiliza Render. |
| `src/services/api.ts` | URL configurable, sin doble `/api/v1`; 60 s timeout; Bearer; normalización del envelope `{ok,message,data}`; manejo de 401 y protección de DELETE. |
| `src/services/response.ts` | Normalización de listas paginadas y mensajes HTTP. |
| `src/services/auth.service.ts` | Reconoce token/access_token/accessToken y datos de usuario de la respuesta o claims JWT; logout al servidor. |
| `src/composables/useAuth.ts` | Sesiones demo antiguas y tokens vencidos descartados; recuperación segura del usuario local. |
| `src/layouts/AppShell.vue` | Logout local inmediato, limpia caches y pide invalidación al backend. |
| `src/views/LoginView.vue` | Muestra errores específicos de login/servidor, no todo como fallo de conexión. |
| `src/services/*`, `src/composables/useCatalogos.ts` | Servicios de listas toleran colecciones envueltas o paginadas; errores de catálogos ya no se silencian globalmente. |
| `src/services/reportes.service.ts`, `src/views/ReportesView.vue` | Excel `.xlsx` y PDF institucionales por descarga binaria autenticada. Se mantiene exportación local CSV/impresión. |
| `scripts/smoke-api.mjs` | Comprobaciones GET y POST login autorizadas; sin POST de creación, PATCH ni DELETE. |

No se cambió el diseño base ni los módulos mock que no tienen ruta backend confirmada.

## 3. Endpoints que aparecen en las capturas de Swagger

Estos nombres fueron leídos **de las capturas suministradas** (no son pruebas end-to-end de todos los métodos):

- **Salud:** `GET /api/v1` → accesible públicamente y devuelve `ok:true` y `data:"Hello World!"` (verificado).
- **Auth:** `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `POST /api/v1/auth/change-password`.
- **Usuarios:** `POST /api/v1/users`, `GET /api/v1/users`, `GET /api/v1/users/search`, `GET /api/v1/users/{id}`, `PATCH /api/v1/users/{id}`, `DELETE /api/v1/users/{id}`.
- **Provincias:** `POST /api/v1/provincia`, `GET /api/v1/provincia`, `GET /api/v1/provincia/{id}`, `PATCH /api/v1/provincia/{id}`, `DELETE /api/v1/provincia/{id}`.
- **Cantones:** `POST /api/v1/canton`, `GET /api/v1/canton`, `GET /api/v1/canton/{id}`, `PATCH /api/v1/canton/{id}`, `DELETE /api/v1/canton/{id}`.
- **Reportes:** `GET /api/v1/reportes/uzdi/adolescentes`, `GET /api/v1/reportes/expedientes/medidas`, `GET /api/v1/reportes/export/excel`, `GET /api/v1/reportes/export/pdf`.
- Aparecen además las secciones **Adolescentes**, **Expedientes**, **Medidas Expediente**, **Infracciones**, **Medidas Socioeducativas**, **Estructura Institucional**, **Usuarios y Seguridad**. Sus operaciones, bodies y respuestas no estaban desplegados en las imágenes.

**Limitación de la verificación remota:** se descargó `/api/docs-json`, pero todos los esquemas DTO publican `properties: {}`. Sin credenciales solo se verificaron Health y documentación; los endpoints de negocio devolvieron 401. Por tanto no se afirma que los CRUD estén probados contra datos reales.

## 4. Prioridad para la demostración

| Módulo | Frontend | Conexión y verificación pendiente |
|---|---|---|
| Inicio de sesión | Adaptado para token JWT, sesión y redirección | Probar login real y confirmar estructura exacta del `user`. |
| Usuarios | Listar/crear/editar ya hacen peticiones reales | Verificar DTO `roles_ids`; Swagger no publica reset-password y DELETE permanece bloqueado. |
| Provincia / Cantón | CRUD configurado a rutas vistas en Swagger | Probar lectura y campos con usuario autorizado. |
| Adolescentes | Listar/crear/editar ya usan `adolescente.service.ts` | Confirmar endpoints exactos, fechas y `nacn_id`,`etcv_id`,`etna_id`,`cntn_id`. |
| Expedientes | Listar/crear/editar integrados a capa REST | Confirmar `POST/PATCH /expediente`, relaciones y estados. |
| Medidas socioeducativas | Servicio HTTP disponible | Confirmar rutas, campos y restricciones de creación. |
| Dashboard | Consume servicios de adolescentes/expedientes y otros módulos | Indicadores secundarios pueden fallar si no existen endpoints. |
| Reportes | Botones adicionales de Excel y PDF del backend | Descargar después de login con permisos; verificar que el reporte contiene datos. |
| Talleres, fichas, educación, familia, documentos, bitácora, permisos | Pantallas presentes y rutas REST declaradas | No afirmar operatividad backend sin revisar Swagger expandido. |

## 5. Instrucciones Windows (PowerShell en VS Code)

Desde la carpeta del ZIP descomprimido, ejecutar:

```powershell
node -v
npm ci
npm run dev
```

Abrir el enlace que muestre Vite (la configuración original propone `http://localhost:5174/`). El proyecto contiene un `.env` listo:

```dotenv
VITE_API_URL=https://uzdi-backend-api.onrender.com/api/v1
VITE_USE_MOCK=false
VITE_ENABLE_DELETE=false
```

No es necesario instalar Node ni PostgreSQL **para el backend** en el equipo del frontend. Sí se necesita Node/npm para compilar y ejecutar Vite. El primer GET a Render Free puede tardar hasta varias decenas de segundos en responder.

El login en modo real requiere **credenciales válidas del backend**. No sirve automáticamente la clave `Snai2026` del mock ni se incluye ninguna contraseña en el proyecto.

### Prueba API sin modificaciones de datos

Primero, sin credenciales (solo Health):

```powershell
npm run test:api
```

Con credenciales autorizadas (PowerShell):

```powershell
$env:UZDI_LOGIN = 'admin'
$env:UZDI_PASSWORD = 'SU_CLAVE_REAL'
npm run test:api
Remove-Item Env:UZDI_PASSWORD
```

El script nunca imprime el token, la clave ni registros personales. Si el endpoint retorna 401/403/404 se muestra el HTTP status. No crea, edita ni elimina registros.

### Validación del código

```powershell
npm run typecheck
npm run build
```

**Verificación realizada aquí:** `vue-tsc -b` finaliza con código 0. La generación completa de `dist` no pudo verificarse en este sistema Linux porque el RAR incluía `node_modules` de Windows y faltaba el binario nativo Linux de Rolldown; `npm ci` instala el binario correcto en el equipo objetivo. Por eso no se incluye un `dist` nuevo ni se afirma que Vite ya haya empaquetado aquí.

## 6. Seguridad y asuntos que debe confirmar backend

- **Baja lógica:** `DELETE` está protegido mientras `VITE_ENABLE_DELETE=false`. Activarlo únicamente después de verificar que no se borran físicamente expedientes, adolescentes ni trazabilidad histórica. Se aplica bloqueo en el cliente para evitar errores en la demo, pero la protección real debe existir en la API.
- **Permisos:** el frontend filtra menús por roles, pero la API debe aplicar RBAC, restricciones por UZDI y validación de JWT en todas sus rutas. El rol mínimo `tppr_id=5` se usa si el token no trae perfil; no se eleva automáticamente a admin por el nombre de usuario.
- **Campos:** el Swagger abierto desde navegador es la fuente de verdad para los tipos exactos; no se inventaron atributos faltantes. Pedir al equipo backend el archivo OpenAPI JSON para completar los DTOs.
- **CORS:** se informó que `localhost:5173/5174` está permitido; confirmar también el origen de GitHub Pages si publican ahí.
- **Cookies/tokens:** para una implantación real con datos de menores se recomienda revisar el almacenamiento de JWT en `localStorage`, políticas XSS, token rotation y revocación con el equipo de seguridad. Esta entrega mantiene el contrato del prototipo.
- **Fechas y reportes:** las descargas institucionales usan los endpoints globales del backend y **pueden no respetar los filtros locales** de fechas o UZDI de la vista; el servidor debe definir y hacer cumplir sus filtros y alcances.

## 7. Checklist funcional para probar en la exposición

1. Ejecutar `npm ci` y `npm run dev`; comprobar pantalla Login.
2. Abrir `https://uzdi-backend-api.onrender.com/api/v1` en otra pestaña; esperar que Render despierte.
3. Login con cuenta autorizada; comprobar que no vuelve a `/login`.
4. DevTools → Network: verificar `POST /auth/login` y `Authorization: Bearer ...` en siguientes GET (no compartir token en capturas públicas).
5. Abrir Catálogos: comprobar Provincias y Cantones.
6. Abrir Usuarios, Adolescentes y Expedientes: revisar que hay datos cargados o estados vacíos genuinos, no datos inventados.
7. Probar **creación/edición solo con registros de prueba autorizados** y previa consulta al equipo backend sobre DTOs.
8. Abrir Reportes y pulsar Excel/PDF institucional; comprobar descargas.
9. Cerrar sesión; probar que vuelve al login y que las pantallas protegidas ya no abren.
10. Si alguna ruta devuelve 404, capturar URL y response body; pedir al backend el endpoint equivalente. Si 400, enviar DTO; si 403, revisar permisos/rol.
