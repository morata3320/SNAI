# PLAN_FRONTEND_UZDI.md — Plan de implementación para OpenCode

**Proyecto:** UZDI_FRONT_SNAI (Vue 3 + TypeScript + Vite)
**Objetivo:** implementar en el frontend **todos los requerimientos funcionales RF-01 a RF-27** y los **requerimientos no funcionales aplicables al frontend (RNF)** definidos en el informe de auditoría "Requerimientos funcionales y no funcionales del Sistema SNAI para las UZDI", **sin tocar el diseño** y **sin backend** (mock), dejando el contrato de API listo para el equipo de backend.

> Lee primero `AGENTS.md`. Sus reglas aplican a todo este plan.
> Este documento es **autosuficiente**: no necesitas el PDF de auditoría.

---

## 0. Cómo usar este plan

1. Ejecuta las fases **en orden** (Fase 0 → Fase 5). Cada fase termina con `npm run build` en verde.
2. Al cerrar una fase, marca el checklist de progreso (§12) y haz un commit si hay git.
3. Etiquetas usadas en este documento:
   - **[AJUSTAR]**: ya existe en el código; se modifica.
   - **[NUEVO]**: no existe; se crea.
   - **[ASUNCIÓN]**: decisión razonable tomada por el equipo de auditoría sin respaldo oficial. Impleméntala **configurable** y regístrala en `docs/DECISIONES_PENDIENTES.md`.
   - **[PENDIENTE]**: el dato lo debe definir la Directora de la UZDI o el SNAI. **No inventes valores**: usa un marcador configurable y regístralo.
4. **Prompt de arranque sugerido** (para el usuario, en OpenCode):
   > `Lee AGENTS.md y PLAN_FRONTEND_UZDI.md completos. Ejecuta la Fase 0 y detente a mostrarme el inventario. Luego continúa fase por fase.`

---

## 1. Estado actual del código (lo que ya existe)

Según el repositorio recibido:

- **Vistas:** Login, Dashboard, Adolescentes, Expedientes, Medidas, Reportes, Perfil, Usuarios, Parámetros.
- **Rutas** (`src/router/index.ts`): `/login` y `/app/{dashboard, adolescentes, expedientes, medidas, reportes, perfil, usuarios, parametros}` con guard por `uzdi_token` en `localStorage`.
- **Acceso** (`src/router/access.ts`): 8 `tppr_id` mapeados a **solo 3 niveles** (1 básico, 2 coordinador, 3 administrador). Es insuficiente: el informe exige permisos por rol y por módulo (§2).
- **Servicios** (`src/services/`): `api.ts` (axios + Bearer), y servicios de auth, adolescente, expediente, medida, usuario, uzdi, catálogo. Catálogos con fallo silencioso (`fetchList` devuelve `[]` en error).
- **Mock** (`src/services/mock/adapter.ts` + `data.ts`): responde en memoria a `/auth`, `/users`, `/uzdi/:id`, `/adolescente`, `/expediente`, `/medida-socioeducativa` y catálogos de solo lectura. Se importa de forma estática desde `api.ts`.
- **Convención del backend** (se observa en payloads): FKs con prefijo de 4 letras `adlc_id`, `uzdi_id`, `infc_id`, `mdso_id`, `nacn_id`, `etcv_id`, `etna_id`, `cntn_id`, `gdo_id`, `tppr_id`. Los endpoints de `/users` envuelven la respuesta en `{ message, data }`; los demás devuelven el arreglo directo.
- **Componentes sin uso** (según `REVISION.md`): `AdolescenteForm`, `ExpedienteForm`, `MedidaForm`, `FormPanel`, `ConfirmModal`, `EmptyState`, `PageHeader`, `SearchBar`, `StatusBadge`. Algunos tienen listas de UZDI fijas. `ConfirmModal` se usará (RNF-13).
- **Estados de expediente** en uso: `En proceso`, `Atraso`, `Incomparecencia`. El `ExpedienteForm` sin uso ofrece otros (`Abierto/En proceso/Cerrado`).
- Eliminación actual: `adolescenteService.remove()` hace `DELETE` real y el toast dice "Registro eliminado" → **debe pasar a baja lógica** (§3.3).
- `AppShell.vue`: sidebar, búsqueda global (Ctrl+K) sobre adolescentes y expedientes, sidebar responsive.

---

## 2. Roles, módulos y permisos (núcleo del plan)

### 2.1 Roles

Siete roles oficiales del documento de requerimientos. Mapeo con los `tppr_id` existentes (no cambiar los ids):

| tppr_id | Rol (etiqueta UI) | Sigla |
|---|---|---|
| 1 | Trabajador Social | TS |
| 2 | Coordinador de área | CO |
| 3 | Administrador | AD |
| 4 | Superadministrador (una sola palabra) | SA |
| 5 | Usuario (heredado) | — |
| 6 | Psicólogo | PS |
| 7 | Educador | ED |
| 8 | Jurídico (en el prototipo del informe se rotula "Abogado/a"; **mantener "Jurídico"**) | JU |

Reglas de terminología (cambio C-18): escribir **Superadministrador** (nunca "Super Administrador"), **Jurídico**, y **no usar "Usuario" como actor** en textos de casos de uso. El `tppr_id` 5 se conserva solo por compatibilidad: acceso mínimo (Dashboard + Mi perfil). **[PENDIENTE]** decidir con la Directora si se retira.

Un usuario puede tener varios roles (`user.roles[]` + `roles_ids` en el mock). Los permisos efectivos son la **unión** de los de todos sus roles; si `roles` no viene, usar `tppr_id`.

### 2.2 Matriz de permisos por defecto

Letras: **V** = ver/consultar · **C** = crear · **E** = editar · **B** = baja lógica/cierre/archivo/atender. `—` = sin acceso al módulo (no aparece en el menú ni la ruta es accesible).

| Módulo (ruta `/app/...`) | RF | SA | AD | CO | TS | PS | ED | JU |
|---|---|---|---|---|---|---|---|---|
| `usuarios` | 01 | VCEB | VCEB | — | — | — | — | — |
| `adolescentes` | 02 | — | V | V | VCEB | V | V | V ¹ |
| `expedientes` | 03 | — | — | V | V | — | — | VCEB |
| `gdos` | 04 | — | VCEB | — | V | — | — | — |
| `medidas` (+ asignaciones) | 05 | — | V | — | — | — | — | VCEB |
| `fichas` (psicológicas) | 06 | — | — | V | — | VCE | — | — |
| `representantes` (+ vínculos) | 07, 13 | — | — | — | VCE | — | — | — |
| `contexto-familiar` | 08 | — | — | V | VCE | V | — | — |
| `permisos` | 10 | VE | V | — | — | — | — | — |
| `uzdi` | 11 | VCEB | V ² | — | — | — | — | — |
| `perfiles` (roles) | 12 | VCEB | V | — | — | — | — | — |
| `talleres` | 14 | — | — | VCEB | — | VCEB | VCEB | — |
| `asistencia-talleres` | 15 | — | — | VCE | — | VCE | VCE | — |
| `reportes` | 16 | V | V | V | V ³ | V ³ | V ³ | V ³ |
| `bitacora` | 22 | V | — | — | — | — | — | — |
| `asignacion-casos` | 23 | — | — | VCE | V ⁴ | V ⁴ | V ⁴ | V ⁴ |
| `educacion` | 24 | — | — | V | — | — | VCEB | — |
| `documentos` | 25 | — | — | V | V | — | — | VCEB |
| `alertas-salud` | 26 | — | — | V | VCEB | — | — | — |
| `informes-tecnicos` | 27 | — | — | V ⁵ | VC | VC | — | VC |
| `parametros` (ya existe) | — | VE | VE | — | — | — | — | — |
| `perfil` (Mi perfil) y `dashboard` | — | todos | todos | todos | todos | todos | todos | todos |

Notas:
1. **[ASUNCIÓN]** El Jurídico necesita consultar adolescentes para crear expedientes (precondición de RF-03).
2. El Administrador consulta solo la UZDI propia; el SA consulta y mantiene todas.
3. Cada perfil ve **solo los tipos de reporte de su área** (decisión propuesta en RF-16). Cada tipo de reporte declara los perfiles que lo ven (ver RF-16). SA/AD/CO ven todos.
4. Cada técnico ve **sus casos asignados** (solo lectura de la asignación).
5. El CO consulta informes ya generados; no los genera. **[ASUNCIÓN]**.
6. Las lecturas de **catálogos** (nacionalidad, estado civil, etnia, provincia, cantón, UZDI, infracción, medidas para selectores, GDO para selector) están abiertas a cualquier usuario autenticado que las necesite en un formulario; no dependen de esta matriz.
7. Esta matriz es solo el **valor por defecto**. La fuente de verdad futura es el backend (`GET /auth/me` → `permisos`, ver §8). El frontend usa la matriz por defecto como respaldo cuando el backend no entrega permisos (caso mock).

### 2.3 Visibilidad por UZDI

Regla de partida: **cada perfil ve solo los registros de su UZDI** (`user.uzdi_id`). El Superadministrador ve todas. El filtrado real lo hará el backend; el frontend:
- no ofrece selectores de otra UZDI a quien no pueda verla;
- el mock **filtra por UZDI del usuario** (el token demo es `demo-token-<id>`; de ahí se obtiene el usuario);
- en Reportes la UZDI es **filtro obligatorio**.

### 2.4 Dominios de información sensible (RNF-05)

Estos dominios solo se muestran a los perfiles que los necesitan. Implementar como mapa configurable (p. ej. `DOMINIOS_SENSIBLES` en el archivo de permisos) y helper `puedeVerDominio(dominio)`:

| Dominio | Perfiles con acceso |
|---|---|
| `psicologico` (fichas) | PS, CO |
| `salud` (alertas de salud) | TS, CO |
| `sociofamiliar` (representantes, contexto familiar) | TS, PS (consulta), CO |
| `juridico` (expedientes, documentos, medidas) | JU, TS (consulta), CO |
| `educativo` | ED, CO |
| `gdo` (vinculación del adolescente a un GDO) | TS, CO, JU **[ASUNCIÓN / PENDIENTE]** |

Aplicarlo en: menú, rutas, **búsqueda global (Ctrl+K)** (no mostrar tipos de resultado que el perfil no puede ver), detalle de adolescente (secciones relacionadas), informe técnico (secciones) y reportes.

---

## 3. Reglas transversales (aplican a TODOS los módulos)

### 3.1 Plantilla de módulo CRUD
Todos los módulos de gestión siguen el flujo común del informe:
1. Listado con **buscador** + filtros + paginación (cliente, `PAGE_SIZE = 8` como hoy).
2. Selección de un registro para ver su **detalle**.
3. "Nuevo" abre formulario en modal, **con campos obligatorios marcados**.
4. Al guardar: el sistema **valida**, guarda y **confirma** (toast).
5. "Editar": carga datos actuales, valida y guarda.
6. "Baja" (si el RF la contempla): pide **confirmación** (`ConfirmModal`) y conserva historial.

### 3.2 Validación y errores
- Campos obligatorios y formatos (cédula, correo, fechas, números) validados en cliente; el error se muestra **por campo** con `.f-err`, asociado con `aria-describedby`.
- Fecha final nunca anterior a la inicial.
- **Cédula** (RNF-10): 10 dígitos numéricos, **bloqueante**. Dígito verificador (módulo 10) solo como **advertencia no bloqueante** y solo si la nacionalidad es Ecuatoriana. **[ASUNCIÓN]** (los datos mock no son cédulas reales).
- **Duplicados**: si el backend responde `409` en cédula, mostrar "Ya existe un registro con esa cédula" en el campo y **no** crear otro. El mock debe emularlo.
- **Formato estándar de error** esperado del backend (documentarlo en `API_CONTRACT.md`):
  ```json
  { "message": "Texto legible", "errors": { "campo": "mensaje" } }
  ```
  Crear `src/services/errors.ts` con `parseApiError(e)` que devuelva `{ message, fieldErrors }` y úsalo en todos los `catch`. Códigos: `400/422` validación, `401` sesión, `403` sin permiso (toast "No tiene permisos para esta acción", sin redirigir), `404`, `409` duplicado, `423/429` bloqueo.

### 3.3 Baja lógica (cambio C-06, RNF-07)
Reemplaza cualquier `DELETE` por baja lógica. Contrato propuesto:
- Entidades con campo `activo: boolean` (`PATCH /<recurso>/:id` con `{ "activo": false }`) para: adolescente, usuario, GDO, medida (catálogo), taller, perfil.
- Entidades con **estado propio** en vez de `activo`: expediente → `Cerrado`; documento → `Archivado`; alerta de salud → `Atendida`; educación → `Retirado`.
- Los listados muestran por defecto solo activos, con filtro "Estado: Activos / Inactivos / Todos" usando el mismo control visual `.tool-select`.
- Textos: **"Desactivar"**, "Cerrar", "Archivar" (nunca "Eliminar"). Toast: "Registro desactivado. El historial se conserva."
- Un registro dado de baja no ofrece "Editar", salvo reactivación por quien tenga permiso **[ASUNCIÓN]**.
- Los servicios exponen `desactivar(id)`; **eliminar `remove()` de los servicios** de las entidades anteriores.

### 3.4 Confirmaciones y mensajes (RNF-12, RNF-13)
Usar `ConfirmModal` para toda baja/cierre/archivo y para guardar permisos. El texto explica el efecto ("El expediente quedará en solo consulta y no recibirá nuevos movimientos."). Mensajes de éxito/error siempre en español vía `useToast`.

### 3.5 Trazabilidad visible (RNF-09)
Los DTOs de entidades sensibles incluyen opcionalmente `creado_por`, `creado_en`, `modificado_por`, `modificado_en`. Si vienen, mostrarlos en el **detalle** con el estilo existente de pares etiqueta/valor. El **frontend nunca escribe la bitácora**: la escribe el backend. (El mock sí la emula, ver RF-22.)

### 3.6 Sesión e inactividad (RNF-01, RNF-03, RNF-04)
- Nunca guardar contraseñas fuera del formulario; el objeto `uzdi_user` en `localStorage` no debe contener contraseña.
- **[NUEVO]** `src/composables/useInactividad.ts`: cierra sesión tras *N* minutos sin actividad (mouse/teclado/click), con aviso previo. *N* sale de Parámetros (`tiempo_sesion_min`); si no existe, **[PENDIENTE]** valor por configuración (`DEFAULT_INACTIVITY_MIN`, hoy 30 como demo). Se activa en `AppShell`.
- El bloqueo por intentos fallidos **lo hace el backend**. El frontend maneja `423`/`429` mostrando "Cuenta bloqueada temporalmente. Intente más tarde o contacte al administrador." (con tiempo restante si viene en `retry_after`). Conservar el contador local solo como ayuda de UX.

### 3.7 Catálogos (RF-09, 17, 18, 19, 20; RNF-11)
- Los campos de apoyo **se eligen de listas**, nunca se escriben: nacionalidad, estado civil, etnia, provincia, cantón, GDO, infracción, medida.
- **[NUEVO]** catálogo **Provincia** (`GET /provincia`) y **Cantón dependiente de provincia** (`cantones` con `provincia_id`; el select de cantón se filtra por la provincia elegida). Aplicar en el formulario de UZDI (Parámetros/UZDI) y, "a futuro", dejar la estructura lista para el domicilio del adolescente (no añadir campo nuevo al formulario del adolescente si no está en el prototipo).
- **Fallo de catálogo (garantía mínima del informe):** reemplazar el `catch { return [] }` silencioso. `useCatalogos` expone `errorCatalogos` por catálogo; el formulario muestra un aviso inline ("No se pudo cargar <catálogo>. Reintente.") con botón reintentar y **deshabilita Guardar** mientras un catálogo obligatorio falte.
- Fuente: los catálogos geográficos y demográficos se **cargan del backend** (fuente oficial **[PENDIENTE]** definir con el SNAI). El mock mantiene sus listas ficticias.
- Etnia: lista del informe = mestizo/a, indígena, afroecuatoriano/a, montubio/a, blanco/a. El mock actual añade "Otra"; **no quitarla** (cambio mínimo), pero documentarlo.

### 3.8 Estructura reutilizable (RNF-17)
Para evitar duplicar 12+ módulos casi idénticos:
- **[NUEVO]** `src/components/crud/CrudModule.vue`: replica **exactamente** el marcado y clases de `AdolescentesView.vue` (hero, toolbar, tabla `.tbl`, paginación, modal, confirmación) y se configura con una **definición de entidad**.
- **[NUEVO]** `src/entities/<entidad>.ts`: definición declarativa (título, descripción del hero, ruta, columnas, campos del formulario con tipo/obligatorio/validador/opciones, reglas de baja, dominio sensible, permisos).
- Úsalo para los módulos **nuevos**. Migrar las vistas existentes a `CrudModule` es **opcional y solo al final** (Fase 5), y únicamente si el DOM/clases quedan idénticos; si hay duda, déjalas como están.
- Si un módulo necesita algo que `CrudModule` no resuelve (p. ej. asignación de casos, permisos, bitácora, informe técnico), escribe una vista propia con la misma estructura visual.

### 3.9 Accesibilidad sin cambiar el diseño (RNF-14)
Meta WCAG 2.1 AA **solo en lo que no altere el aspecto visual**: `<label for>` en todos los campos, `aria-describedby` en errores, `aria-live` en toasts, foco visible existente respetado, **trampa de foco y Escape** en modales, navegación por teclado en tablas/acciones, `aria-label` en botones con solo ícono. **No cambiar colores ni tamaños.** Si detectas un problema de contraste, **no lo corrijas**: regístralo en `docs/DECISIONES_PENDIENTES.md`.

### 3.10 Estados de carga y vacío (RNF-16)
Cada listado muestra skeleton `.sk` mientras carga y un estado vacío (`EmptyState` si encaja visualmente; si no, el patrón vacío ya usado en las vistas). Errores de carga: aviso inline con botón "Reintentar" (no dejar la tabla vacía sin explicación).

---

## 4. Fase 0 — Línea base (no cambia código)

- [ ] Leer `AGENTS.md`, `README.md`, `REVISION.md`, `CAMBIOS_PALETA_SNAI.md`.
- [ ] `npm install` y `npm run build`. Anotar el resultado base.
- [ ] Confirmar `.env` con `VITE_USE_MOCK=true`.
- [ ] Revisar `ReportParams.vue` / `ReportesView.vue` y listar los **tipos de reporte actuales** (hay 5). Revisar qué datos nominales exponen.
- [ ] Revisar `AdolescentesView.vue` (patrón de referencia), `AdolescenteForm.vue`, `ExpedienteForm.vue`, `MedidaForm.vue`, `AppShell.vue`, `PerfilView.vue`, `ParametrosView.vue`, `UsuariosView.vue`.
- [ ] Crear carpeta `docs/` y los archivos vacíos con título: `API_CONTRACT.md`, `MATRIZ_PERMISOS.md`, `DECISIONES_PENDIENTES.md`, `INTEGRACION_BACKEND.md`, `CAMBIOS_CSS.md`.
- [ ] Si no hay git: `git init` + commit "línea base".
- [ ] **Entregable:** un inventario breve (≤ 40 líneas) en el chat: archivos clave, tipos de reporte, y cualquier discrepancia con este plan. Luego continúa.

---

## 5. Fase 1 — Cimientos

Objetivo: infraestructura sobre la que se apoya todo lo demás. Sin pantallas nuevas todavía.

1. **Permisos** — Reemplazar `src/router/access.ts` por `src/router/permisos.ts` (mantener `ROLE_LABEL`, `levelFor` solo si algo aún lo usa; si no, retirarlos):
   - `DEFAULT_PERMISOS: Record<rolId, Record<modulo, ('V'|'C'|'E'|'B')[]>>` según §2.2.
   - `DOMINIOS_SENSIBLES` según §2.4.
   - Composable `usePermisos()` → `puede(modulo, accion)`, `puedeVerDominio(dominio)`, `modulosVisibles`. Toma `user.permisos` (del backend, si llega) o `DEFAULT_PERMISOS` por roles (unión).
2. **Navegación declarativa** — `src/router/nav.ts`: lista de ítems del sidebar (`ruta`, `etiqueta`, `ícono` de `@lucide/vue`, `modulo`, `sección` GENERAL/GESTIÓN/ANÁLISIS/CONFIGURACIÓN). `AppShell` y las tarjetas de accesos rápidos del Dashboard **derivan de esta lista filtrada por permisos**. Conservar el orden y aspecto actuales; los ítems nuevos se agrupan en las secciones existentes (los módulos sociales/clínicos en GESTIÓN, bitácora/permisos/perfiles/UZDI en CONFIGURACIÓN, informes y reportes en ANÁLISIS). El sidebar actual ya está compactado para 1280×720: con más ítems, hacer que la zona de navegación **haga scroll interno** sin cambiar estilos (solo `overflow-y: auto` si ya no lo tiene; anotar en `CAMBIOS_CSS.md`).
3. **Router** — Rutas nuevas (vistas con un esqueleto temporal si aún no existen), cada una con `meta: { modulo }`. El guard `beforeEach` valida `puede(meta.modulo, 'V')` y, si falla, redirige a `/app/dashboard` con toast "No tiene acceso a ese módulo". Mantener lógica de login/redirect y modo hash.
4. **Capa API** — En `src/services/api.ts`:
   - Carga **dinámica** del mock: `if (VITE_USE_MOCK === 'true') api.defaults.adapter = (cfg) => import('./mock/adapter').then(m => m.mockAdapter(cfg))`. Nada más importa el mock.
   - Interceptor de respuesta: `403` → toast sin redirigir; `401` fuera del login → comportamiento actual.
   - `src/services/unwrap.ts`: `unwrap(res)` que acepta `{ data: ... }` o el arreglo directo (hoy `/users` y `/uzdi/:id` envuelven y el resto no). Todos los servicios lo usan.
5. **Errores** — `src/services/errors.ts` (`parseApiError`), según §3.2.
6. **Catálogos** — Ampliar `catalogo.service.ts` y `useCatalogos.ts`: provincias, cantones con `provincia_id`, estados de error por catálogo (§3.7), `recargar(nombre)`.
7. **Inactividad** — `useInactividad.ts` (§3.6) conectado a `AppShell`.
8. **Base CRUD** — `CrudModule.vue` y la forma de `src/entities/*.ts` (§3.8). Hacer una entidad de prueba pequeña (p. ej. GDOs) para validar el patrón visualmente idéntico a `AdolescentesView`.
9. **Auth** — `auth.service.ts`: añadir `me()` → `GET /auth/me` (user + permisos). `useAuth` guarda `permisos` si llegan. Asegurar que **no se persiste contraseña**.
10. **Utilidades** — `src/utils/validators.ts` (cédula, correo, teléfono, fechas) y `src/utils/format.ts` (fechas dd/mm/aaaa) reutilizando las funciones que hoy están duplicadas en los servicios.

**Criterio de salida:** `npm run build` verde; con el mock, cada uno de los 8 usuarios demo ve un sidebar distinto acorde a §2.2 y las rutas no permitidas redirigen.

---

## 6. Fase 2 — Ajustes a lo que ya existe

### RF-21 Ingreso al sistema — [AJUSTAR] (`LoginView.vue`, `auth.service.ts`)
- Actor: todos. Flujo: formulario usuario/contraseña → validar campos → verificar → identificar perfil → habilitar menú del perfil.
- Credenciales incorrectas **o** usuario inexistente → un solo mensaje que **no revela cuál falló**: "Usuario o contraseña incorrectos".
- Campos vacíos → marcar cuáles son obligatorios.
- Bloqueo temporal: manejar `423/429` (§3.6). Recuperación de contraseña: el enlace "¿Olvidó su contraseña?" muestra un aviso "Contacte al administrador de su UZDI para restablecerla" (la recuperación la hace el Administrador, ver RF-01).
- Los **botones de perfil demo** de la pantalla de login solo existen con `VITE_USE_MOCK=true`. No cambiar su aspecto.
- Tras iniciar sesión, llamar `me()` para cargar permisos si el backend los entrega.

### RF-01 Gestión de usuarios — [AJUSTAR] (`UsuariosView.vue`, `usuario.service.ts`)
- Actores: Administrador y Superadministrador (módulo `usuarios`).
- Campos del formulario: **nombres, apellidos, cédula, cargo, teléfono, correo institucional, usuario de ingreso (login), contraseña inicial, UZDI, perfil/rol**. Hoy faltan **cédula, cargo y UZDI**. La **UZDI es obligatoria para todos los perfiles**.
- Mantener la selección de roles tal como está visualmente (casillas).
- Baja lógica de cuenta (`activo=false`) con confirmación y conservación de historial. Hoy la vista solo tiene editar: añadir "Desactivar" con el mismo estilo de botones de acción de otras tablas.
- Acción **"Restablecer contraseña"** (solo AD/SA): `POST /users/:id/reset-password` → el backend devuelve una contraseña temporal (o la envía por correo); mostrar mensaje. Esto cubre la recuperación de contraseña en la primera versión (cambio C-05).
- Errores: login o cédula duplicados → error en el campo (`409`).
- Un Administrador **no** puede asignar roles de Superadministrador **[ASUNCIÓN]**.

### RF-02 Gestión de adolescentes — [AJUSTAR] (`AdolescentesView.vue`, `adolescente.service.ts`)
- Actor: Trabajador Social (CRUD). AD, CO, PS, ED y JU solo consulta (ocultar Nuevo/Editar/Desactivar según permisos).
- Campos (ya existen casi todos): cédula, nombres, apellidos, fecha de nacimiento, sexo, fecha de ingreso, nacionalidad, estado civil, etnia, cantón, GDO (opcional, opción "Sin vinculación"), n.º de hijos, centro educativo, reincidente, hijo de PPL, observaciones.
- **El delito/infracción NO va en este formulario** (se registra en el expediente, como en el prototipo). El informe lista "delito o infracción" en el flujo de RF-02; hay contradicción interna. Regístralo en `DECISIONES_PENDIENTES.md`.
- Cambios: baja lógica en vez de `DELETE` (§3.3); validación de cédula y **duplicado** (§3.2); filtro por estado Activos/Inactivos; botón "Ver" abre **detalle** (modal) con datos generales y secciones relacionadas **filtradas por dominio sensible** (expedientes, representantes, etc., solo si el perfil puede verlas) y los campos de trazabilidad (§3.5).
- Por defecto solo los adolescentes de la UZDI del usuario (§2.3).

### RF-03 Gestión de expedientes — [AJUSTAR] (`ExpedientesView.vue`, `expediente.service.ts`)
- Actor: Jurídico (CRUD). TS y CO solo consulta.
- Campos: adolescente, UZDI, infracción, medida socioeducativa, estado, fecha de inicio, fecha de fin **+ nuevos: número de causa, juzgado de origen, defensor/a, observaciones**. (El informe habla de "fechas de apertura y cierre": se mantienen `fecha_inicio_medida` / `fecha_fin_medida` que usa el prototipo.)
- **Estados** unificados: `En proceso`, `Atraso`, `Incomparecencia`, `Cerrado`. `Cerrado` tono `slate`. **[PENDIENTE]** confirmar estados oficiales. Dejarlos en una constante única `ESTADOS_EXPEDIENTE`. Alinear `ExpedienteForm.vue` (sin uso) a esa constante o eliminar su lista propia.
- **Cierre en vez de eliminación**: acción "Cerrar expediente" → confirma → estado `Cerrado`. Un expediente cerrado: sigue visible con filtro de estado, **sin edición** y sin nuevos movimientos.
- El adolescente debe estar previamente registrado (precondición).
- Visibilidad limitada a la UZDI del usuario.

### RF-04 Gestión de GDOs — [NUEVO como módulo] (hoy solo catálogo de solo lectura)
- Ruta `/app/gdos`. Actor: Administrador (CRUD); TS consulta (a través del selector del adolescente).
- Campo: **nombre del grupo**. Desactivar un GDO lo oculta de nuevos registros pero conserva historial y adolescentes ya vinculados.
- Servicio nuevo `gdo.service.ts` con CRUD (el mock hoy solo tiene `GET /gdo`).
- Asociación del adolescente con un GDO: **opcional**.

### RF-05 Gestión de medidas y asignación — [AJUSTAR] (`MedidasView.vue`, `medida.service.ts`)
- Actor: Jurídico (CRUD); Administrador consulta. Los demás perfiles ven la medida desde el expediente.
- **Catálogo de medidas**: nombre, **duración de referencia (meses, opcional)** y **descripción** (nuevo campo). La duración del catálogo es **referencial**; no es la duración del caso (cambio C-03).
- **Asignación a adolescente** (nuevo, dentro de la misma vista, pestañas/segmentos "Catálogo" | "Asignaciones" con los controles existentes): formulario con **adolescente, medida, fecha de inicio, fecha de fin estimada, detalle de cumplimiento**. Servicio `asignacionMedida` (`/asignacion-medida`). Precondición: existen adolescentes y expedientes.
- Nota de modelo: ya hay una medida y fechas dentro del expediente. La asignación es el registro de **cumplimiento** de esa medida; documentar la relación en `API_CONTRACT.md` y dejar el campo `expd_id` (expediente) opcional en la asignación. Regístralo como duda para backend.
- Baja lógica de la medida del catálogo.

### RF-16 Reportes estadísticos — [AJUSTAR] (`ReportesView.vue` y `components/reportes/*`)
- Acceso: todos los perfiles, **pero cada tipo de reporte declara qué perfiles lo ven** (`REPORTE_TIPOS[].perfiles`). Por defecto: SA/AD/CO todos; TS → los de adolescentes; PS y ED → los de participación en talleres; JU → los de expedientes/medidas. **[ASUNCIÓN]** Ajustarlo según los 5 tipos reales.
- Parámetros: **tipo, UZDI (obligatoria), rango de fechas**. Validar: campos obligatorios; **fecha final ≥ inicial**.
- Resultado: **vista previa** (gráfico + tabla). **Solo datos agregados**: ningún reporte, tabla, gráfico ni exportación puede mostrar **nombre ni identificación** de adolescentes (RNF-06). Revisa los tipos existentes (Fase 0) y elimina columnas nominales.
- Exportar:
  - **PDF**: `window.print()` actual; añadir CSS `@media print` **aditivo** (oculta sidebar/topbar/botones; anotar en `CAMBIOS_CSS.md`).
  - **Excel**: reemplazar el `alert()` por exportación real. **Dependencia autorizada: `xlsx`** (SheetJS). Aislar en `src/services/reporte.service.ts` → `exportarExcel(reporte)`, para poder sustituirla por un endpoint del backend (`GET /reportes/export?...`) sin tocar la vista.
- Cada descarga debe quedar registrada por el backend (RNF-08); el frontend llama `POST /reportes/descargas` (evento) al exportar. Mock lo registra en la bitácora.
- Los reportes de talleres usan RF-14/RF-15 (participación grupal). Si faltan datos, indicar "Sin datos para el periodo".

### Dashboard y búsqueda global — [AJUSTAR]
- Tarjetas de accesos rápidos derivadas de `nav.ts` y permisos (ya filtran por nivel; pasar a permisos por módulo).
- Búsqueda global (Ctrl+K): solo incluye adolescentes/expedientes si el perfil puede verlos; no mostrar cédulas a perfiles sin acceso.
- Técnicos: tarjeta "Mis casos asignados" **[NUEVO]** (visible si el módulo `asignacion-casos` devuelve casos para el usuario; mismo estilo de tarjetas existentes).

### Mi perfil (`PerfilView.vue`) — [AJUSTAR]
- Pantalla de cuenta propia y cambio de contraseña (RNF-01). No es un RF; mantener. Validar mínimo 8 caracteres y confirmación; mensajes en español.

### Parámetros (`ParametrosView.vue`) — [AJUSTAR]
- Conserva organización/seguridad/notificaciones. Los valores (intentos, minutos de sesión, caducidad de contraseña) son **demostración**; los definitivos los define el SNAI (RNF-03, RNF-04). Dejar un texto discreto "Valores de demostración" **solo si no altera el diseño** (si lo altera, omitirlo y anotarlo en decisiones).
- Persistir en el mock `tiempo_sesion_min` para que `useInactividad` lo lea.

**Criterio de salida Fase 2:** `npm run build` verde; flujos de adolescentes/expedientes/medidas/usuarios con baja lógica; login con mensajes genéricos; reportes exportan PDF y Excel sin datos nominales.

---

## 7. Fase 3 — Módulos nuevos de atención técnica

Usar `CrudModule` + `src/entities/*.ts` + `*.service.ts` + mock. Todos cumplen §3 y la plantilla del informe. Los **valores de listas** que aparecen abajo son los del informe; si el informe dice "por ejemplo", es **sugerencia**, no catálogo oficial.

### RF-06 Fichas psicológicas — `/app/fichas`
- Actor: **Psicólogo** (VCE). CO consulta. Dominio `psicologico`: solo PS y CO.
- Campos: adolescente, **tipo de ficha** (evaluación inicial / seguimiento psicológico / intervención en crisis), fecha, motivo, observaciones, recomendaciones.
- Sin baja (el flujo del informe no la incluye). Edición permitida.
- **[PENDIENTE]** El "plan de intervención evolutivo" del diagrama de contexto: ¿documento aparte o parte de la ficha? No implementar aún; dejar anotado.

### RF-07 + RF-13 Representantes y vínculos — `/app/representantes`
- Actor: **Trabajador Social** (VCE). Dominio `sociofamiliar`.
- Campos: nombres, apellidos, **parentesco** (madre, padre, abuelo/a, tío/a, hermano/a, tutor/a legal), teléfono, dirección, **es representante principal** (casilla).
- **Vínculo adolescente–representante (RF-13)**: un representante puede vincularse a **varios adolescentes** y un adolescente puede tener **varios representantes**. Modelo: entidad `vinculo { repr_id, adlc_id, parentesco, es_principal }`. El selector de adolescentes ofrece **solo adolescentes activos**. El vínculo se ve en el detalle de ambos registros.
- Teléfono y dirección **obligatorios solo si es principal**.
- Precondición: el adolescente referente existe. Sin baja en el flujo (solo editar vínculo).

### RF-08 Contexto familiar — `/app/contexto-familiar`
- Actor: **Trabajador Social** (VCE). PS y CO consulta. Dominio `sociofamiliar`.
- **Dos registros distintos** (dos pestañas/segmentos):
  1. **Intervenciones familiares** (registro cronológico): representante, fecha de intervención, motivo, descripción.
  2. **Ficha sociofamiliar**: **[PENDIENTE]** estructura por definir con el equipo técnico. Implementar con un conjunto mínimo (adolescente, fecha, observaciones generales) definido en una constante `FICHA_SOCIOFAMILIAR_CAMPOS` fácil de ampliar. **No inventes campos adicionales.**
- Precondición: el representante está registrado.

### RF-14 Talleres — `/app/talleres`
- Actores: **Educador, Psicólogo y Coordinador de Área** (VCEB; el CO lo usa sobre todo para supervisión).
- Campos: nombre, tema (texto libre; "autoestima", "habilidades sociales", "proyecto de vida" son solo ejemplos), objetivo, fecha, hora de inicio y fin (fin ≥ inicio), lugar, institución cooperante.
- Baja lógica: "Desactivar taller".

### RF-15 Asistencia a talleres — `/app/asistencia-talleres`
- Actores: ED, PS, CO (VCE).
- Campos: **taller, adolescente, asistencia del adolescente (sí/no), asistencia del representante (sí/no)**. Esquema sí/no hasta que el equipo defina otros estados (asistencia parcial/justificada **[PENDIENTE]**).
- Precondición: existen taller y adolescente. Sin baja. Alimenta el "reporte de participación grupal" (RF-16).

### RF-24 Información educativa — `/app/educacion`
- Actor: **Educador** (VCEB). CO consulta. Dominio `educativo`.
- Campos: adolescente, **nivel educativo**, institución, **estado** (matriculado / nivelación / graduado / retirado), observaciones.
- "Baja" = marcar **Retirado** (sin borrar historial).
- **[PENDIENTE]** Catálogo oficial de niveles y estados: usar una lista configurable `NIVELES_EDUCATIVOS` (por ejemplo, EGB, Bachillerato, Nivelación) marcada como provisional.

### RF-25 Documentos habilitantes — `/app/documentos`
- Actor: **Jurídico** (VCEB). CO y TS consulta. Dominio `juridico`.
- Campos: **tipo** (oficio, informe técnico, resolución, acta, notificación), número, adolescente, expediente, emisor, fecha de registro, estado, contenido.
- Estados: `Registrado` / `Archivado` **[ASUNCIÓN]** (el informe no los define). "Baja" = **Archivar** (nunca eliminar).
- **Primera versión sin adjuntos**: solo datos. Dejar en `API_CONTRACT.md` una nota de ampliación futura (subida de archivos). No implementar carga de archivos.
- Precondición: el adolescente y el expediente existen; el expediente se filtra por el adolescente elegido.

### RF-26 Alertas de salud — `/app/alertas-salud` (por validar)
- Actor: **Trabajador Social** (VCEB). CO consulta. Dominio `salud`: solo TS y CO (son datos de salud, categoría especial).
- Campos: adolescente, **tipo** (salud mental, medicación, enfermedad crónica, control médico, consumo problemático), fecha, **estado** (pendiente / en seguimiento / atendida), descripción. "Baja" = marcar **Atendida**.
- **Marcado "por validar" con la Directora de la UZDI.** Implementar detrás de un **feature flag** `VITE_FEATURE_ALERTAS_SALUD` (por defecto `true` en `.env.example` y `.env`; si es `false`, la ruta y el ítem del menú no existen). Anotar en decisiones.
- Prioridad baja / riesgo alto: no mostrar contenido de estas alertas en búsqueda global, dashboard ni reportes.

**Criterio de salida Fase 3:** `npm run build` verde; cada módulo con CRUD completo en el mock, permisos de §2.2 respetados y dominios sensibles bloqueados a otros perfiles.

---

## 8. Fase 4 — Administración, seguridad y supervisión

### RF-12 Perfiles / roles — `/app/perfiles`
- Actor: **Superadministrador** (CRUD); AD consulta.
- Campos: nombre del rol, descripción. Los **siete roles iniciales** son semilla; el conjunto es **abierto** (se pueden crear más, solo el SA). Desactivar un perfil impide asignarlo a nuevos usuarios, pero no afecta a los existentes.
- `RoleLabel` ya no puede ser un diccionario fijo: los roles vienen de `GET /perfil` (el diccionario actual queda como respaldo del mock).

### RF-10 Permisos — `/app/permisos`
- Actor: **Superadministrador** (consulta y edita). AD solo consulta (C-07).
- Flujo: lista de perfiles → seleccionar perfil → matriz **módulos × acciones (crear, ver, editar, desactivar)** con casillas → guardar (con `ConfirmModal`) → mensaje de confirmación.
- Los cambios se aplican en el **siguiente ingreso** de los usuarios del perfil (`Postcondición` del informe). El frontend no recarga permisos en vivo.
- Servicio: `GET /permiso?perfil=:id`, `PUT /permiso/perfil/:id`. La matriz por defecto de §2.2 se usa como **semilla del mock**.
- El guardado debe quedar en bitácora (RF-22).
- La pantalla usa la misma tabla y casillas que el resto del sistema; no introducir nuevos componentes visuales.

### RF-11 UZDI — `/app/uzdi`
- Actor: **Superadministrador** (CRUD del catálogo). Los demás perfiles ven **solo la suya**.
- Campos: nombre, zona, **provincia, cantón (dependiente de provincia)**, dirección, teléfono, correo institucional.
- Uso como **filtro obligatorio en reportes** y como asociación obligatoria de usuarios.
- Distinguir de `Parámetros`, que configura la unidad propia (organización/seguridad/notificaciones).

### RF-22 Bitácora de seguridad — `/app/bitacora`
- Actor: **Superadministrador** (solo lectura). La bitácora **no se puede editar ni borrar desde la interfaz**.
- Filtros: **usuario, tipo de evento, rango de fechas**.
- Eventos listados: inicios de sesión, modificaciones de usuarios, **cambios de permisos**, **descargas de reportes**, **generación de informes técnicos**.
- Tabla: fecha/hora, usuario, evento, detalle. Estilo `.tbl` existente.
- **[PENDIENTE]** plazo de conservación y quién puede exportarla: no implementar exportación.
- El mock debe **registrar eventos reales** cuando ocurren (login, alta/edición de usuario, guardado de permisos, descarga de reporte, generación de informe).

### RF-23 Asignación de casos a técnicos — `/app/asignacion-casos`
- Actor: **Coordinador de Área** (VCE). Los técnicos ven sus casos asignados en solo lectura.
- Flujo: lista de adolescentes/expedientes de la UZDI con su asignación actual → elegir caso → asignar **un técnico por eje de atención** → guardar (queda en el **historial del caso**) → el CO consulta el avance.
- **Ejes de atención** = social (TS), psicológico (PS), educativo (ED), jurídico (JU). Los candidatos son los usuarios activos con ese rol en la misma UZDI.
- **Reasignar** exige **motivo obligatorio**.
- Servicio: `GET/POST /asignacion-caso`, historial en `GET /asignacion-caso/:casoId/historial`.
- Precondición: existen adolescentes y usuarios técnicos activos.

### RF-27 Informe técnico del adolescente — `/app/informes-tecnicos`
- Actor: TS, PS, JU (genera). CO consulta.
- Flujo: buscar y seleccionar adolescente → elegir **tipo de informe y periodo** → el sistema **reúne solo los registros a los que el perfil tiene acceso** → genera y presenta (vista previa imprimible) → registra la generación en bitácora.
- **Tipos de informe**: **[PENDIENTE]**. Usar por defecto `Evaluación` y `Seguimiento` (el DFD habla de "documento técnico final de evaluación") en una constante configurable.
- **Plantilla** **[PENDIENTE]** (estructura y quién firma). Implementarla como **lista de secciones configurable**, cada una con su dominio sensible: Datos generales, Expediente y medida (juridico), Evaluación psicológica (psicologico), Contexto sociofamiliar (sociofamiliar), Trayectoria educativa (educativo), Documentos (juridico). La sección se **omite** si el perfil no puede verla. Línea de firma como marcador `[Firma por definir]`.
- Imprimir/guardar PDF con `window.print()` + CSS `@media print` aditivo. No exportar a Excel.
- Precondición: el adolescente debe tener registros; si no, mostrar estado vacío.

**Criterio de salida Fase 4:** `npm run build` verde; permisos editables en el mock y reflejados en el siguiente login; la bitácora muestra eventos reales emulados.

---

## 9. Fase 5 — Mock completo, RNF y documentación de integración

### 9.1 Mock (`src/services/mock/`)
Ampliar `adapter.ts` y `data.ts` para **todos los endpoints nuevos** con las mismas formas que el contrato. Requisitos:
- Datos ficticios coherentes y suficientes para ver paginación, estados y filtros; **nombres claramente ficticios**.
- **Filtrado por UZDI** según el usuario del token.
- `409` en cédula/login duplicados; `403` cuando el rol no tiene permiso para esa acción (el mock debe respetar la matriz, para detectar fallos de permisos antes de la integración); `423` tras *N* intentos fallidos (con *N* = valor de Parámetros del mock, por defecto 3 como demo).
- **Baja lógica real**: los `GET` devuelven también inactivos con `activo=false`; el filtro del front decide qué mostrar.
- Registra eventos en la bitácora (RF-22).
- Respuestas con **forma coherente**: arreglo directo en listados y objeto en detalle; `{ message, data }` solo donde el backend real ya lo hace (`/users`, `/uzdi/:id`), todo vía `unwrap`.

### 9.2 Pasada de RNF
- **RNF-01** contraseñas nunca en texto plano/almacenadas/mostradas. **RNF-02** cada acción respeta la matriz (botones ocultos y rutas protegidas) y un acceso no autorizado muestra mensaje informativo. **RNF-03/04** bloqueo y sesión (§3.6). **RNF-05/06** dominios sensibles y datos agregados en reportes. **RNF-07** baja lógica. **RNF-08/09** bitácora y trazabilidad visible. **RNF-10/11** validaciones y catálogos. **RNF-12/13** usabilidad y confirmaciones. **RNF-14** accesibilidad sin alterar diseño. **RNF-15** sin scroll horizontal de página (las tablas hacen scroll en su contenedor, ya existente). **RNF-16** estados de carga/vacío. **RNF-17** estructura reutilizable. **RNF-18** exportación PDF/Excel. **RNF-19** (respaldo) es de backend/infra: solo documentarlo. **RNF-20** todo en español.
- Revisar en toda la UI: ninguna cadena en inglés, ningún "Eliminar" restante donde ahora hay baja lógica, "Superadministrador" escrito correctamente, ninguna aparición de "Abogado/a" ni de "Usuario" como actor.

### 9.3 Opcional (solo si todo lo anterior está en verde)
- Migrar `MedidasView` y `UsuariosView` a `CrudModule` **solo si** el resultado visual es idéntico. Si hay cualquier duda, no migrar.

### 9.4 Documentación (obligatoria)
- `docs/API_CONTRACT.md`: **una sección por endpoint** con método, ruta, parámetros/filtros, cuerpo, respuesta, códigos de estado, ejemplo y notas. Incluye: auth, usuarios, perfiles, permisos, uzdi, adolescente, representante, vínculo, contexto familiar, ficha psicológica, expediente, medida, asignación de medida, GDO, taller, asistencia, educación, documento, alerta de salud, asignación de caso, informe técnico, reportes, bitácora y todos los catálogos. Marca los nombres de campos nuevos como **PROPUESTA** (backend puede renombrarlos). Incluye el **formato de error**, convención de `activo`, baja lógica, auditoría (`creado_por`, etc.), paginación (hoy en cliente; si el volumen lo exige, se propone `?page&limit` como ampliación) y el campo `permisos` de `/auth/me`.
- `docs/MATRIZ_PERMISOS.md`: la matriz final de §2.2 + dominios sensibles + supuestos.
- `docs/DECISIONES_PENDIENTES.md`: tabla con **ID, tema, qué se asumió, dónde cambiarlo en el código, quién decide** (Directora de la UZDI / SNAI / Backend). Debe incluir como mínimo: estados de expediente; rol "Usuario"; alcance de GDO por perfil; infracción en RF-02 vs expediente; estructura de ficha sociofamiliar; tipos y plantilla del informe técnico; niveles educativos; estados de documento; alertas de salud (alcance y acceso); relación asignación de medida ↔ expediente; valores de bloqueo/sesión; plazo de la bitácora; fuente de catálogos geográficos; denominación oficial "Unidad de Desarrollo Integral" vs "Unidad Zonal de Desarrollo Integral" (el estatuto del SNAI usa la primera; el proyecto usa la segunda; se mantiene **UZDI**); problemas de contraste detectados (RNF-14).
- `docs/INTEGRACION_BACKEND.md`: guía para el equipo de backend: variables de entorno (`VITE_API_BASE_URL`, `VITE_USE_MOCK=false`), cómo apagar el mock, lista de endpoints que deben implementar por prioridad, cómo se leen los permisos, formato de errores, y el **checklist de integración** (login → me → permisos → catálogos → CRUD por módulo).
- Actualizar `README.md`: rutas nuevas, roles, estructura de carpetas y la sección "Control de acceso" (hoy dice 3 roles/3 niveles).
- Actualizar `.env.example` con `VITE_FEATURE_ALERTAS_SALUD`.

**Criterio de salida Fase 5:** ver §10.

---

## 10. Verificación final (ejecutar y reportar)

1. `npm run build` ✔ sin errores.
2. Iniciar sesión con **cada uno de los 8 usuarios demo** (`superadmin`, `admin`, `coordinador`, `tsocial`, `psicologo`, `educador`, `juridico`, `tsocial.gye`; contraseña `Snai2026`) y confirmar: sidebar = columna correspondiente de §2.2; las rutas prohibidas redirigen al dashboard con aviso.
3. Un usuario de UZDI Guayaquil (`tsocial.gye`) **no** ve adolescentes de Quito.
4. Crear adolescente con **cédula duplicada** → error en el campo, sin crear.
5. Desactivar adolescente/usuario/GDO/taller → desaparece del listado de activos, aparece con filtro "Inactivos"; no hay ningún `DELETE` en el código (`grep -rn "\.delete(" src/` solo debe aparecer donde el contrato lo permita, idealmente en ningún sitio).
6. Cerrar un expediente → queda sin edición.
7. Reporte: parámetros inválidos bloquean; datos sin nombres; exportación PDF y Excel funcionan.
8. Guardar permisos de un perfil → aparece en bitácora; al volver a entrar con ese perfil cambia el menú.
9. Generar informe técnico con un perfil sin acceso a un dominio → esa sección **no** aparece.
10. `git diff --stat -- src/design-system.css` solo muestra **adiciones** (o nada), y cada adición está en `docs/CAMBIOS_CSS.md`.
11. `grep -rn "console.log" src/` no imprime datos de adolescentes.
12. Todos los archivos de `docs/` existen y están completos.

---

## 11. Fuera de alcance (no implementar)

- Backend real, base de datos, autenticación del lado servidor, envío de correos.
- **Seguimiento posterior a la medida** (futuro; el estatuto del SNAI lo atribuye a la Dirección de Medidas Socioeducativas).
- **Expediente único** y continuidad con los Centros de Adolescentes Infractores (CAI).
- Carga de **archivos adjuntos** en documentos.
- Matriz de trazabilidad completa del informe y diagramas UML.
- Cambios de diseño, tema oscuro, nuevas tipografías o paleta.
- Citas de artículos de ley dentro de la aplicación.

---

## 12. Checklist de progreso (marcar al terminar cada ítem)

**Fase 0**
- [ ] Inventario entregado y discrepancias anotadas

**Fase 1**
- [ ] `permisos.ts` + `usePermisos` + `nav.ts` + guard por módulo
- [ ] `api.ts` (mock dinámico, 403), `unwrap.ts`, `errors.ts`
- [ ] Catálogos con errores + provincia/cantón
- [ ] `useInactividad`
- [ ] `CrudModule` + entidad de prueba idéntica visualmente
- [ ] `/auth/me` y permisos en sesión

**Fase 2**
- [ ] RF-21 login
- [ ] RF-01 usuarios (+ cédula, cargo, UZDI, baja, reset de contraseña)
- [ ] RF-02 adolescentes (baja lógica, duplicado, detalle)
- [ ] RF-03 expedientes (campos nuevos, estado Cerrado)
- [ ] RF-04 GDOs
- [ ] RF-05 medidas + asignaciones
- [ ] RF-16 reportes (validación, agregados, PDF, Excel)
- [ ] Dashboard, búsqueda global, Mi perfil, Parámetros alineados

**Fase 3**
- [ ] RF-06 fichas
- [ ] RF-07 + RF-13 representantes y vínculos
- [ ] RF-08 contexto familiar
- [ ] RF-14 talleres
- [ ] RF-15 asistencia
- [ ] RF-24 educación
- [ ] RF-25 documentos
- [ ] RF-26 alertas de salud (feature flag)

**Fase 4**
- [ ] RF-12 perfiles
- [ ] RF-10 permisos
- [ ] RF-11 UZDI
- [ ] RF-22 bitácora
- [ ] RF-23 asignación de casos
- [ ] RF-27 informe técnico

**Fase 5**
- [ ] Mock completo (UZDI, 409, 403, 423, bitácora)
- [ ] Pasada RNF-01…RNF-20
- [ ] `API_CONTRACT.md`
- [ ] `MATRIZ_PERMISOS.md`
- [ ] `DECISIONES_PENDIENTES.md`
- [ ] `INTEGRACION_BACKEND.md`
- [ ] README y `.env.example` actualizados
- [ ] Verificación final §10 reportada
