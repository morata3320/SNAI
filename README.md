# UZDI_FRONT — Frontend Vue 3

Aplicación frontend del Sistema de Gestión Integral UZDI. Construida con Vue 3, TypeScript y Vite.

Repositorio integrado: [morata3320/SNAI](https://github.com/morata3320/SNAI).

---

## Stack

| Dependencia | Rol |
| --- | --- |
| Vue 3.5 + TypeScript | Framework reactivo con `<script setup>` y Composition API |
| Vite 8 | Bundler y servidor de desarrollo con HMR |
| Vue Router 5 | Enrutamiento SPA con guards de autenticación |
| axios | Cliente HTTP con interceptor JWT automático |
| @lucide/vue | Íconos SVG como componentes Vue |

---

## Estructura

```text
src/
├── main.ts                     # Punto de entrada
├── App.vue                     # Componente raíz (RouterView)
├── design-system.css           # Tokens CSS y clases globales
├── router/                     # Rutas, matriz RBAC y guard
├── layouts/AppShell.vue        # Sidebar, topbar y búsqueda global
├── views/                      # Login, dashboard, módulos y configuración
├── components/
│   ├── crud/                   # ModulePanel para módulos declarativos
│   ├── dashboard/              # Gráficos, skeleton y accesos rápidos
│   ├── ui/                     # Modales, estados vacíos, toasts y formularios
│   └── reportes/               # Parámetros, tabla y gráfico de reportes
├── entities/registry.ts        # Definición declarativa de módulos CRUD
├── services/                   # Servicios REST y adaptador mock
├── composables/                # Sesión, permisos, catálogos, inactividad y toasts
├── config/                     # Seguridad y valores pendientes del SNAI
└── utils/                      # Validadores de cédula, correo, teléfono y fechas
```

---

## Rutas

```text
/                   → redirect /login
/login              → LoginView
/app/dashboard      → DashboardView
/app/adolescentes   → AdolescentesView
/app/representantes → RepresentantesView
/app/contexto-familiar, /app/alertas-salud, /app/fichas, /app/educacion,
/app/talleres, /app/asistencia-talleres, /app/documentos, /app/gdos,
/app/asignacion-casos, /app/uzdi, /app/perfiles → ModuleView
/app/expedientes    → ExpedientesView
/app/medidas        → MedidasView
/app/catalogos      → CatalogosView
/app/reportes       → ReportesView
/app/informes       → InformesView
/app/bitacora       → BitacoraView
/app/permisos       → PermisosView
/app/usuarios       → UsuariosView
/app/parametros     → ParametrosView
/app/perfil         → PerfilView
```

El guard redirige a `/login` sin sesión y aplica la matriz de acceso por módulo y acción. Una ruta no autorizada vuelve al dashboard con un aviso.

---

## Control de acceso (RBAC)

| tppr_id | Rol |
| --- | --- |
| 1 | Trabajador/a Social |
| 2 | Coordinador/a de área |
| 3 | Administrador/a |
| 4 | Superadministrador/a |
| 5 | Usuario (sin módulos, conservado por compatibilidad) |
| 6 | Psicólogo/a |
| 7 | Educador/a |
| 8 | Jurídico |

La matriz `MODULE_ACCESS` de `src/router/access.ts` define las acciones `view`, `create`, `edit` y `deactivate` por rol. El menú, los accesos rápidos y los botones de cada vista usan la misma matriz.

---

## Design System

`design-system.css` define todas las variables CSS y clases globales. No usa ningún framework de UI externo.

**Variables principales:**

```css
--color-brand-blue
--color-brand-blue-light
--color-surface / --color-surface-mute / --color-surface-soft
--color-text-primary / --color-text-secondary / --color-text-muted
--color-border
--color-success / --color-success-bg
--color-error / --color-error-bg
--radius-sm / --radius-md / --radius-lg / --radius-xl / --radius-full
```

**Clases globales de uso frecuente:**

| Clase | Uso |
| --- | --- |
| `.page` | Contenedor raíz de cada vista |
| `.hero` | Cabecera de página con eyebrow, título y descripción |
| `.card` | Panel con borde, radio y sombra suave |
| `.tbl` | Tabla con cabecera, hover por fila y badges |
| `.badge` + tono | Pill coloreado: `green`, `amber`, `red`, `slate`, `blue` |
| `.btn` / `.btn-primary` / `.btn-ghost` | Botones con variantes y `:active` |
| `.btn-sm` | Variante compacta para acciones en tabla |
| `.f-ctl` / `.f-label` / `.f-err` | Inputs, selects y textareas del sistema de formularios |
| `.modal` `.sm/.md/.lg` | Modal con backdrop oscuro |
| `.sk` | Skeleton shimmer para estados de carga |
| `.tool-search` / `.tool-select` | Barra de herramientas de filtros |

---

## Autenticación

El token JWT se guarda en `localStorage` bajo la clave `uzdi_token`. El composable `useAuth()` expone:

- `token` — ref con el token actual
- `user` — ref con los datos del usuario logueado
- `isLoggedIn` — computed boolean
- `setSession(token, user)` — guarda sesión
- `logout()` — limpia localStorage y refs

El servicio `api.ts` añade automáticamente `Authorization: Bearer <token>` a todas las peticiones axios.

---

## Modo demo

Con `VITE_USE_MOCK=true` el adaptador de `src/services/mock/` responde las mismas rutas REST que el backend. Los datos viven en memoria y se reinician al recargar.

Usuarios demo: `superadmin`, `admin`, `coordinador`, `tsocial`, `psicologo`, `educador`, `juridico`, `tsocial.gye`.

Contraseña: `Snai2026`.

Con `VITE_USE_MOCK=false` se usa `VITE_API_URL` como backend real (también se admite `VITE_API_BASE_URL` por compatibilidad). Revisa **INTEGRACION_RENDER.md** antes de desplegar.

---

## Integración con Render (noviembre de 2026)

La configuración lista para producción y las pruebas se documentan en **[INTEGRACION_RENDER.md](INTEGRACION_RENDER.md)**. Ejecuta `npm ci`, `npm run dev` y `npm run test:api` (con credenciales autorizadas para comprobar endpoints protegidos). No se realizan cambios destructivos en las pruebas.

La auditoría actual del OpenAPI, los módulos realmente expuestos y las limitaciones de DTO están en **[docs/INTEGRACION_BACKEND_REAL.md](docs/INTEGRACION_BACKEND_REAL.md)**. En modo real, los módulos sin endpoint confirmado se ocultan para no presentar datos simulados como institucionales.

---

## Desarrollo

```bash
npm install
npm run dev       # http://localhost:5174
npm.cmd run build # En Windows/PowerShell: vue-tsc + vite build
npm run test:api  # Health + OpenAPI; agrega login/GET solo con credenciales autorizadas
npm run audit:openapi # verifica las rutas usadas contra el contrato publicado
npm run preview   # Sirve el build localmente
```

El modo real usa `VITE_API_URL=https://uzdi-backend-api.onrender.com/api/v1`. No requiere backend, Docker ni PostgreSQL locales. En modo demo no se necesita conexión externa.

## Despliegue en Render

El archivo `render.yaml` prepara un **Static Site** con:

- Build: `npm ci && npm run build`.
- Directorio público: `dist`.
- API real de Render.
- Mock y DELETE desactivados.
- Rewrite SPA de `/*` a `/index.html`.

En Render, conecte el repositorio `morata3320/SNAI` mediante **New → Blueprint** o cree un Static Site con los mismos valores. No reutilice ni modifique el servicio backend `uzdi-backend-api`.

Documentación adicional:

- `docs/CUMPLIMIENTO.md`: estado de RF y RNF.
- `docs/PENDIENTES_SNAI.md`: decisiones configurables pendientes de validación.
