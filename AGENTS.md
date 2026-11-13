# AGENTS.md — Implementar los requerimientos del Sistema UZDI/SNAI (solo frontend)

> Este archivo es la instrucción principal para el agente. Léelo completo antes de tocar código.
> Trabaja por fases, en orden. Al terminar cada fase ejecuta `npm run build` y corrige todos los errores antes de pasar a la siguiente.

---

## 0. Misión y reglas de oro

**Misión:** completar el frontend de `UZDI_FRONT_SNAI` (Vue 3 + TypeScript + Vite) para que cubra los 27 requerimientos funcionales (RF-01 a RF-27) y los 20 no funcionales (RNF-01 a RNF-20) del informe «Requerimientos funcionales y no funcionales del Sistema SNAI para las UZDI».

**Reglas de oro**

1. **Solo frontend.** No crear backend, no crear base de datos, no tocar nada fuera de este proyecto. Todo lo que el backend haría se simula en `src/services/mock/` (modo demo `VITE_USE_MOCK=true`).
2. **Cada servicio nuevo debe hablar con rutas REST reales** (`/api/v1/...`) usando `src/services/api.ts`, y el mock adapter debe responder esas mismas rutas. Así, cuando exista backend, solo se apaga el mock.
3. **No inventar datos oficiales.** Donde el informe dice «por definir con el SNAI» (intentos de login, minutos de inactividad, plazos de respaldo, retención de bitácora, estructura de la ficha sociofamiliar, plantilla del informe técnico), crea un valor **configurable** en Parámetros o una constante nombrada en `src/config/pendientes.ts` con un comentario `// POR DEFINIR CON EL SNAI`. Nunca dejes una cifra «mágica» suelta en el código.
4. **No agregar librerías** salvo las permitidas en la sección 3. No usar frameworks de UI (Tailwind, Vuetify, etc.). Todo el estilo sale de `src/design-system.css`.
5. **No borrar físicamente registros en la interfaz.** Toda «eliminación» es **baja lógica** (campo `activo`/`estado`) con confirmación y conservando historial (cambio C-06, RNF-07, RNF-13). Los botones de eliminar actuales (`Ban`) deben comportarse así y su texto debe decir «Desactivar», «Cerrar», «Archivar» o «Retirar» según el caso, nunca «Eliminar».
6. **Todo en español**: textos, mensajes de error, etiquetas, comentarios de negocio (RNF-20).
7. **Datos de adolescentes = datos sensibles.** Nunca mostrar nombre o imagen de un adolescente en reportes agregados ni en la bitácora; nunca poner datos de adolescentes en `console.log`, en la URL ni en `localStorage` (RNF-05, RNF-06).
8. Cuando una decisión del informe esté marcada «propuesta de este informe» o «por validar», impleméntala pero déjala fácil de cambiar (ver sección 8, «Decisiones por validar»).

---

## 1. Estado actual del proyecto (lo que YA existe)

Stack: Vue 3.5, vue-router, axios, `@lucide/vue`, Vite, TypeScript. Sin librería de UI. Puerto dev: 5174.

```
src/
├── router/index.ts, access.ts      # guard + niveles de acceso (solo 3 niveles)
├── layouts/AppShell.vue            # sidebar, topbar, búsqueda global Ctrl+K
├── views/                          # Login, Dashboard, Adolescentes, Expedientes,
│                                   # Medidas, Reportes, Perfil, Usuarios, Parametros
├── components/ui/                  # ConfirmModal, EmptyState, FormPanel, PageHeader,
│                                   # SearchBar, StatusBadge, ToastContainer
├── components/{adolescentes,expedientes,medidas,reportes,dashboard}/
├── composables/                    # useAuth, useCatalogos, useToast
├── services/                       # api.ts + un service por módulo
└── services/mock/{adapter.ts,data.ts}   # backend simulado en memoria
```

Patrón de cada vista CRUD actual (**imítalo**, ver `MedidasView.vue` como referencia):
`hero` → `toolbar` (`.tool-search`, `.tool-select`, botón `.btn-primary`) → `.tbl-card > table.tbl` → paginación (`.pag`) → modales `.backdrop > .modal.md` con `.modal-head / .modal-body / .modal-foot`, formularios con `.fsec`, `.frow`, `.f`, `.f-label`, `.f-ctl`, `.f-err`, `.req`. Notificaciones con `useToast()`. Íconos de `@lucide/vue`.

### Hallazgos importantes (léelos, afectan el diseño)

- **El PDF de informe dice que el prototipo ya implementa RF-04, 06, 07, 08, 10, 11, 12, 13, 14, 15, 24, 25, 26 con módulos por rol. El zip NO los contiene.** El zip solo tiene 8 módulos: Dashboard, Adolescentes, Expedientes, Medidas, Reportes, Perfil, Usuarios, Parámetros. Por tanto **hay que construir todos los módulos faltantes desde cero**, siguiendo el estilo existente.
- **El RBAC actual solo tiene 3 niveles** (`access.ts`: 1 básico, 2 coordinador, 3 admin) y todos los perfiles técnicos (Psicólogo, Educador, Jurídico, T. Social) ven lo mismo. El informe exige **acceso por módulo según el rol** (siete roles). Hay que reemplazar esto por una matriz rol → módulos → acciones (Fase 0).
- Roles en el mock (`tppr_id`): 1 Trabajador Social · 2 Coordinador de área · 3 Administrador · 4 Superadministrador · 5 «Usuario» · 6 Psicólogo · 7 Educador · 8 Jurídico. El informe aclara que **«Usuario» no es un actor** (cambio C-18): conserva el id 5 por compatibilidad pero no lo ofrezcas como rol asignable en formularios de usuario, y trátalo como sin módulos.
- El rol 8 se llama «Jurídico» en el informe; el prototipo previo lo rotulaba «Abogado/a». **Usa «Jurídico»**. Usa «Superadministrador» (una sola palabra).
- El `ExpedienteForm.vue` y otros componentes de `components/*` **no se usan** en ninguna vista, y `ExpedienteForm` ofrece estados distintos (`Abierto/En proceso/Cerrado`) a los del servicio (`En proceso/Atraso/Incomparecencia`). Decide: las vistas son la fuente de verdad; elimina o reutiliza esos componentes pero no dejes dos versiones del mismo formulario. Añade el estado **«Cerrado»** al expediente (RF-03, paso 9).
- Login: hay contador de intentos solo en el navegador. Eso es lo máximo posible en frontend; déjalo marcado como simulación (ver RF-21).

---

## 2. Matriz de acceso objetivo (rol → módulos)

Implementa **exactamente** esta matriz (fuente: informe, Tabla 3 y especificaciones RF). `C` crear · `E` editar · `B` baja lógica · `V` solo consulta.

| Módulo (ruta `/app/...`) | RF | Superadmin | Admin | Coordinador | T. Social | Psicólogo | Educador | Jurídico |
|---|---|---|---|---|---|---|---|---|
| `dashboard` | — | V | V | V | V | V | V | V |
| `perfil` (cuenta propia) | RNF-01 | CEB* | CEB* | CEB* | CEB* | CEB* | CEB* | CEB* |
| `usuarios` | RF-01 | CEB | CEB | — | — | — | — | — |
| `uzdi` | RF-11 | CEB (todas) | V (la suya) | V (la suya) | V | V | V | V |
| `perfiles` | RF-12 | CEB | V | — | — | — | — | — |
| `permisos` | RF-10 | CE | V | — | — | — | — | — |
| `parametros` | RNF-03/04 | CE | CE | — | — | — | — | — |
| `adolescentes` | RF-02 | V | V | V | CEB | V | V | V |
| `representantes` | RF-07, 13 | — | — | V | CEB | — | — | — |
| `contexto-familiar` | RF-08 | — | — | V | CE | V | — | — |
| `alertas-salud` | RF-26 | — | — | V | CE | — | — | — |
| `fichas` (psicológicas) | RF-06 | — | — | V | — | CE | — | — |
| `educacion` | RF-24 | — | — | V | — | — | CEB | — |
| `talleres` | RF-14 | — | — | V (supervisión) | — | CEB | CEB | — |
| `asistencia-talleres` | RF-15 | — | — | V | — | CE | CE | — |
| `expedientes` | RF-03 | — | V | V | V | — | — | CE + cerrar |
| `medidas` (catálogo + asignación) | RF-05 | — | V | — | V (desde expediente) | V | V | CEB + asignar |
| `documentos` | RF-25 | — | — | — | — | — | — | CE + archivar |
| `gdos` | RF-04 | — | CEB | — | V | — | — | — |
| `catalogos` (cantón, provincia, nacionalidad, estado civil, etnia) | RF-09, 17–20 | V | CEB | — | V | — | — | — |
| `asignacion-casos` | RF-23 | — | — | CE | V (sus casos) | V (sus casos) | V (sus casos) | V (sus casos) |
| `reportes` | RF-16 | V | V | V | V | V | V | V |
| `informes` (técnico del adolescente) | RF-27 | — | — | V | CE | CE | — | CE |
| `bitacora` | RF-22 | V (solo lectura) | — | — | — | — | — | — |

\* Cada usuario edita su propio perfil y cambia su contraseña.

Reglas transversales de alcance (RF-02, RF-03, RF-11, RNF-05):
- **Por defecto cada perfil ve solo los registros de su UZDI** (`user.uzdi_id`). El Superadministrador ve todas las UZDI y puede filtrar.
- **Información sensible por eje de atención:** fichas psicológicas solo Psicólogo + Coordinador; alertas de salud solo Trabajador Social + Coordinador; contexto familiar T. Social + Psicólogo + Coordinador; documentos solo Jurídico. Los demás perfiles **no ven ni el enlace en el menú ni la ruta** (el guard debe bloquearla).
- Ruta no autorizada → redirigir a `/app/dashboard` y mostrar un toast informativo (RNF-02).

---

## 3. Dependencias permitidas

Solo se permite agregar:
- `xlsx` (SheetJS) — exportar reportes a Excel (RF-16, RNF-18). Si no puede instalarse, generar un `.csv` con BOM UTF-8 y explicar la limitación en un comentario.
- Nada más. PDF se resuelve con `window.print()` + hoja de estilos `@media print` (ya existe un enfoque similar en `ReportesView`). Gráficos con los componentes propios `DashBarChart` / `DashDonut` o SVG simple.

---

## 4. Plan de trabajo por fases

### FASE 0 — Cimientos transversales (hacer primero, todo depende de esto)

**0.1 Permisos por rol**
- Reescribir `src/router/access.ts`: reemplazar `ACCESS_LEVEL/ROUTE_MIN_LEVEL` por:
  - `ROLE_KEY: Record<number, RoleKey>` (`superadmin | admin | coordinador | tsocial | psicologo | educador | juridico | usuario`).
  - `MODULE_ACCESS: Record<ModuleId, Partial<Record<RoleKey, Action[]>>>` con la matriz de la sección 2 (`'view' | 'create' | 'edit' | 'deactivate'`).
  - `canAccess(module)` y `can(module, action)`.
- Crear `src/composables/usePermisos.ts` que exponga `can()`, `canAccess()` y `moduleVisible()` leyendo el usuario de `useAuth`.
- La matriz debe poder **editarse desde la pantalla RF-10** (Fase 1): guardarla en el mock (`/permisos`) y, al cargar sesión, `usePermisos` consulta `/permisos/:rol`; si falla usa la matriz por defecto codificada. (En el mock el cambio «se aplica en el siguiente ingreso», tal como dice la postcondición de RF-10.)
- Actualizar `router/index.ts`: una ruta por módulo con `meta: { module: 'fichas' }` y un único guard que llame `canAccess(to.meta.module)`.
- Actualizar `AppShell.vue`: construir `navGroups` filtrando por `canAccess`. Grupos del menú: **General** (Inicio, Mi perfil) · **Gestión** (los módulos de atención del rol) · **Análisis** (Reportes, Informes) · **Configuración** (Usuarios, UZDI, Perfiles, Permisos, Parámetros, Bitácora, Catálogos). Ocultar los grupos vacíos. Mantener el menú compacto (cabe en 1280×720; si hay muchos ítems, hacer el área `.sb-nav` con scroll).
- Añadir iconos lucide a cada módulo nuevo (hoy el menú usa SVG inline en el objeto `icons`; los nuevos pueden usar componentes lucide, pero sé consistente).

**0.2 Alcance por UZDI**
- Composable `useAlcance.ts`: `uzdiActual`, `esGlobal` (solo Superadministrador) y helper `filtrarPorUzdi(rows)`.
- Todos los listados del mock deben filtrar por `uzdi_id` del usuario salvo el Superadministrador. Para eso el mock debe leer el usuario desde el token (`demo-token-<id>`) en cada petición.

**0.3 CRUD reutilizable (para no repetir 15 vistas)**
- Crear `src/composables/useCrud.ts`: estado `rows`, `cargando`, `error`, `search`, `page`, `PAGE_SIZE`, `filtered`, `paged`, `modal`, `form`, helpers `openNew/openEdit/openDeactivate`, `guardar`, `desactivar`, con toasts. Debe aceptar un objeto de servicio `{ getAll, create, update, deactivate }`.
- Crear componentes en `src/components/ui/`: `DataTable.vue` (tabla + paginación + estado vacío + skeleton), `ModalForm.vue` (cabecera con eyebrow, cuerpo, pie con Cancelar/Guardar, cierre con Esc), `FormField.vue` (label + control + error asociado con `aria-describedby`). Refactoriza **por lo menos** los módulos nuevos para usarlos; los antiguos pueden migrarse al final si queda tiempo.
- Reutilizar `ConfirmModal.vue` para toda baja lógica (explicar el efecto: «El registro dejará de ofrecerse en nuevos registros; el historial se conserva»).

**0.4 Validaciones comunes** — `src/utils/validators.ts`
- `validarCedulaEC(cedula)`: 10 dígitos, provincia 01–24 (o 30), tercer dígito < 6, dígito verificador módulo 10. Documentar el algoritmo en el código.
- `validarEmail`, `validarTelefonoEC` (09XXXXXXXX celular / 0[2-7]XXXXXXX fijo), `fechaFinNoAnterior(inicio, fin)`, `requerido`.
- Mostrar los errores en el campo (`.f-err`) y marcar los campos obligatorios con `.req`. Un formulario inválido no se envía (RNF-10).

**0.5 Mock genérico ampliado** — `src/services/mock/`
- Refactorizar `adapter.ts` para registrar colecciones declarativamente (`registerCollection('/ficha', db.fichas, { hydrate, scope: 'uzdi', softDelete: true })`) en vez de `if` por ruta.
- `DELETE` en el mock debe hacer baja lógica (`activo=false` o `estado='Inactivo'`) y **no** quitar la fila; los `GET` aceptan `?activo=true|false` y `?estado=`.
- Cada escritura (POST/PATCH/baja) añade un evento a la colección `bitacora` con `{ id, fecha, usuario_id, tipo, entidad, detalle }`. **El `detalle` jamás incluye nombres de adolescentes**, solo IDs/códigos (RNF-06, RNF-08, RNF-09).
- Cada registro sensible guarda `creado_por`, `creado_en`, `modificado_por`, `modificado_en` (RNF-09).
- Ampliar `data.ts` con datos ficticios coherentes para todas las colecciones nuevas, con al menos 8–13 registros en las principales y datos en las 3 UZDI, para que los filtros y reportes se vean reales.

**0.6 Accesibilidad, responsive e idioma** (RNF-12, 14, 15, 20) — aplicar en todo lo nuevo
- Cada `input/select/textarea` con `<label for>` o `aria-label`; mensajes de error con `role="alert"` y `aria-describedby`.
- Navegación por teclado: modales con foco atrapado, cierre con `Esc`, foco inicial en el primer campo, retorno del foco al botón que lo abrió.
- Botones solo-ícono con `aria-label` y `title`.
- Contraste AA (usar tokens existentes; no introducir colores nuevos). Estados nunca solo por color: el `badge` siempre lleva texto.
- Tablas dentro de `.tbl-card` (ya tiene `overflow-x:auto`); la página nunca debe desplazarse horizontalmente en 360 px.

**Criterio de aceptación Fase 0:** el menú cambia según el rol con que se ingresa (probar con los 8 usuarios demo); entrar por URL a un módulo no permitido redirige al dashboard con un aviso; `npm run build` pasa.

---

### FASE 1 — Ajustar los módulos que ya existen

**RF-21 · Ingreso (`LoginView.vue`)**
- Mensaje de error único «Usuario o contraseña incorrectos» (no revela cuál falló). Campos vacíos: indicar cuáles son obligatorios.
- Bloqueo temporal tras N intentos fallidos consecutivos: N y duración vienen de `pendientes.ts`/Parámetros (por defecto 3 intentos y 5 min, **marcados por definir**). Mostrar cuenta regresiva. Dejar comentado que el bloqueo real lo hará el backend (RNF-03).
- «¿Olvidó su contraseña?» → mostrar mensaje «Solicite el restablecimiento al administrador de su UZDI» (restablecimiento lo hace el Administrador en la primera versión, cambio C-05). Sin flujo de correo.
- Los botones de «Modo demostración» (elegir perfil) deben mostrarse **solo si** `VITE_USE_MOCK === 'true'`.
- Al ingresar, registrar el evento `inicio_sesion` en la bitácora (mock).

**RF-01 · Usuarios (`UsuariosView.vue`)** — acceso Superadministrador + Administrador
- Formulario: nombres, apellidos, **cédula**, **cargo**, teléfono, correo institucional, usuario (login), contraseña inicial, **UZDI (obligatoria para todos los perfiles)**, rol/perfil (los 7 roles reales; excluir «Usuario»).
- Reemplazar eliminar por **desactivar cuenta** (baja lógica con confirmación, conserva historial). Filtro por estado Activo/Inactivo.
- Acción «Restablecer contraseña» (solo Administrador/Superadmin): asigna una contraseña temporal y la muestra una sola vez en un toast/modal; el mock marca `debe_cambiar_clave`.
- Un Administrador solo ve usuarios de su UZDI; el Superadministrador, todos.
- Validar cédula, correo, teléfono y login único.

**RF-02 · Adolescentes (`AdolescentesView.vue` + `AdolescenteForm`)** — gestiona Trabajador Social; los demás en consulta
- Botones de crear/editar/desactivar visibles **solo** si `can('adolescentes', ...)`.
- Campos: cédula, nombres, apellidos, fecha de nacimiento, sexo, fecha de ingreso, nacionalidad, estado civil, etnia, cantón, GDO (opcional, con opción «Sin vinculación»), n.º de hijos, centro educativo, reincidente, hijo de PPL, observaciones. Edad calculada.
- **Cédula duplicada:** si el mock responde 409, mostrar «Ya existe un adolescente con esa cédula» y no crear (RNF-10).
- Validar cédula ecuatoriana, fecha de nacimiento (edad 12–17 al ingreso; si no cumple, **advertir** pero no bloquear), fecha de ingreso no futura.
- Detalle (ícono ojo): modal de solo lectura con datos personales y pestañas/enlaces a lo que su rol puede ver (expedientes, representantes, etc.).
- Baja lógica con confirmación («Retirar adolescente»). Filtros: nacionalidad (ya existe), estado (activo/retirado).
- Respetar alcance por UZDI.

**RF-03 · Expedientes (`ExpedientesView.vue` + `ExpedienteForm`)** — gestiona Jurídico; consulta T. Social, Coordinador, Administrador
- Campos nuevos: **n.º de causa**, **juzgado de origen**, **defensor/a**, fecha de apertura, fecha de cierre, estado, observaciones; además de adolescente, UZDI, infracción y medida.
- Estados: `En proceso`, `Atraso`, `Incomparecencia`, **`Cerrado`**. «Cerrar expediente» (ya no hay eliminar): confirmación, el expediente queda de solo consulta (sin editar, sin nuevos movimientos) y accesible con el filtro de estado.
- El adolescente del selector debe estar activo; filtro por UZDI según alcance.

**RF-05 · Medidas (`MedidasView.vue` + `MedidaForm`)** — gestiona Jurídico
- Catálogo: nombre, **duración de referencia (meses)**, **descripción**, activo. Desactivar en lugar de eliminar.
- Nueva sección/pestaña **«Asignaciones»** y botón «Asignar a adolescente»: formulario con adolescente, expediente (filtrado por adolescente), medida, **fecha de inicio**, **fecha fin estimada** (se autocompleta con inicio + duración de referencia pero es editable), **detalle de cumplimiento**. Validar fin ≥ inicio. Listado de asignaciones con estado.
- Aclarar en la UI que la duración del catálogo es **referencial** y que la fecha fin se registra por asignación (cambio C-03).
- Otros roles ven la medida en consulta desde el expediente.

**RF-16 · Reportes (`ReportesView.vue`)** — todos los perfiles, tipos según rol
- Tipos de reporte filtrados por perfil (ej.: Coordinador y Administrador: estadístico general, por medida, por UZDI, vencimientos; Educador/Psicólogo: participación en talleres; T. Social: familias/representantes; Jurídico: expedientes por estado y medida). Definir un mapa `REPORTES_POR_ROL` en un solo archivo.
- Parámetros: tipo, **UZDI obligatoria** (el Superadmin elige cualquiera o «Todas»; los demás quedan fijos en la suya), rango de fechas con validación (campos obligatorios; fecha final no anterior a la inicial).
- Vista previa en gráfico **y** tabla. **Datos solo agregados: ninguna columna con nombre, cédula o imagen de adolescentes** (RNF-06).
- Exportar **Excel** (xlsx) y **PDF** (imprimir/guardar). Cada descarga registra `descarga_reporte` en la bitácora (mock). Los botones ya existentes en pantalla deben funcionar de verdad.
- Reporte nuevo «Participación grupal» (RF-15 lo alimenta).

**RF-10 · Permisos (NUEVA vista `PermisosView.vue`)** — edita Superadministrador; Administrador solo consulta
- Lista de perfiles a la izquierda; a la derecha matriz **módulos × acciones** (crear, ver, editar, desactivar) con casillas. Guardar con confirmación y toast; registrar `cambio_permisos` en bitácora. Para el Administrador las casillas están deshabilitadas.
- Aviso visible: «Los cambios se aplican en el siguiente ingreso de los usuarios del perfil».

**RF-11 · UZDI (NUEVA vista `UzdiView.vue`, y el selector global)**
- Listado con nombre, zona, provincia, cantón, dirección, teléfono. Superadministrador: CRUD + desactivar; resto: ve solo la suya.
- La UZDI debe funcionar como **filtro obligatorio en reportes** y selector en usuarios (ya implicado arriba).

**RF-12 · Perfiles/roles (NUEVA vista `PerfilesView.vue`)** — solo Superadministrador
- CRUD de perfiles (nombre y descripción), con **desactivar** (no se asigna a nuevos usuarios). Conjunto abierto. Los 7 iniciales vienen precargados y no se pueden desactivar.

**Parámetros (`ParametrosView.vue`)**
- Mantener las tres tarjetas. Las políticas de seguridad (inactividad, intentos de bloqueo, caducidad de contraseña, duración del bloqueo) deben **leerse realmente** desde el mock y usarse (ver RNF-03/04). Añadir etiqueta «valor de demostración — definitivo por acordar con el SNAI».
- Solo Superadministrador y Administrador.

**Dashboard (`DashboardView.vue`)**
- Los accesos rápidos y las cifras deben depender del rol (ej.: Psicólogo ve fichas pendientes y talleres próximos; Educador, talleres de la semana; T. Social, alertas de salud pendientes y adolescentes sin representante; Coordinador, casos sin asignar; Superadmin, resumen global y último evento de bitácora).
- «Próximos vencimientos»: usar el parámetro «días de anticipación». Resaltar vencidos.

**Búsqueda global (`AppShell.vue`, Ctrl+K)**
- Solo debe buscar entidades que el rol puede ver (no listar expedientes a un Psicólogo). Los resultados nunca incluyen datos que el rol no pueda consultar.

**Perfil (`PerfilView.vue`)**
- Validar la contraseña nueva (mínimo 8 caracteres, distinta de la actual, confirmación coincide). Nunca mostrar contraseñas en texto plano (RNF-01). Mostrar el rol y la UZDI reales.

---

### FASE 2 — Módulos nuevos (todos con listado + buscador + paginación + modal crear/editar + baja lógica con confirmación)

Para cada uno: crear `views/XxxView.vue`, `services/xxx.service.ts`, colección en `mock/data.ts` y rutas en el adapter, ruta en el router con `meta.module`, ítem de menú, y entrada en la matriz de permisos. Tipos TypeScript explícitos para DTO y payload.

| RF | Módulo / ruta | Campos del formulario | Baja lógica | Notas |
|---|---|---|---|---|
| RF-04 | **GDOs** `/app/gdos` | nombre del grupo | Desactivar GDO (deja de ofrecerse en nuevos registros) | Admin gestiona; T. Social consulta. El selector de GDO del adolescente solo ofrece activos. Asociación opcional. |
| RF-06 | **Fichas psicológicas** `/app/fichas` | adolescente, tipo (`Evaluación inicial` / `Seguimiento psicológico` / `Intervención en crisis`), fecha, motivo, observaciones, recomendaciones | No hay baja (solo crear/editar) | Visible solo Psicólogo + Coordinador. Aviso de confidencialidad en la cabecera. |
| RF-07 | **Representantes / familiares** `/app/representantes` | nombres, apellidos, parentesco (`Madre`, `Padre`, `Abuelo/a`, `Tío/a`, `Hermano/a`, `Tutor/a legal`), adolescente(s) referente(s), teléfono, dirección, marca «principal» | Desactivar | **Permitir varios representantes por adolescente.** Teléfono y dirección obligatorios solo si es el representante principal. |
| RF-13 | **Vínculos adolescente–representante** (dentro de RF-07, pestaña «Vínculos» en el modal y en el detalle del adolescente) | adolescente (solo activos), parentesco | Editar/quitar vínculo conservando historial | **Un mismo representante puede vincularse a varios adolescentes** (hermanos): selección múltiple, sin duplicar al representante. Se muestra coherente en ambos lados. |
| RF-08 | **Contexto familiar** `/app/contexto-familiar` | dos pestañas: **Intervenciones** (representante, fecha, motivo, descripción) y **Ficha sociofamiliar** | No | La **estructura de la ficha sociofamiliar está por definir**: implementar solo `representante, fecha, motivo` + un campo libre «Información complementaria» y un banner «Estructura por definir con la Directora de la UZDI». Usar un esquema de campos configurable (`FICHA_SOCIOFAMILIAR_CAMPOS`) para ampliarlo luego. |
| RF-14 | **Talleres** `/app/talleres` | nombre, tema (ej. autoestima, habilidades sociales, proyecto de vida — lista editable), objetivo, fecha, hora inicio, hora fin (fin > inicio), lugar, institución cooperante | Desactivar taller | Educador, Psicólogo gestionan; Coordinador supervisa (solo ve). |
| RF-15 | **Asistencia a talleres** `/app/asistencia-talleres` | taller, adolescente, asistencia adolescente (Sí/No), asistencia representante (Sí/No) | No | Esquema Sí/No por ahora (parcial/justificada = pendiente). Evitar duplicar (taller+adolescente). Alimenta el reporte de participación grupal. Atajo: tomar asistencia de un taller con la lista de adolescentes y casillas. |
| RF-24 | **Información educativa** `/app/educacion` | adolescente, nivel educativo, institución, estado (`Matriculado`, `Nivelación`, `Graduado`, `Retirado`), observaciones | «Marcar como retirado» (sin borrar historial) | Solo Educador (+ Coordinador consulta). Catálogo de niveles/estados **por validar**. |
| RF-25 | **Documentos habilitantes** `/app/documentos` | tipo (`Oficio`, `Informe técnico`, `Resolución`, `Acta`, `Notificación`), número, adolescente, expediente, emisor, fecha de registro, estado, contenido | **Archivar** (no se elimina) | Solo Jurídico. Primera versión **sin adjuntos** (solo datos); dejar un comentario `TODO adjuntos iteración posterior`. |
| RF-26 | **Alertas de salud** `/app/alertas-salud` | adolescente, tipo (`Salud mental`, `Medicación`, `Enfermedad crónica`, `Control médico`, `Consumo problemático`), fecha, estado (`Pendiente`, `En seguimiento`, `Atendida`), descripción | «Marcar como atendida» | **Por validar con la Directora/SNAI.** Detrás de un flag `FEATURES.alertasSalud` en `pendientes.ts` (por defecto `true` en demo). Datos de salud = categoría especial LOPDP: acceso solo T. Social + Coordinador, aviso de confidencialidad en cabecera, y **no mostrar la descripción en listados**, solo en el detalle. |
| RF-23 | **Asignación de casos** `/app/asignacion-casos` | caso (adolescente/expediente), técnico responsable **por eje** (Social, Psicológico, Educativo, Jurídico — uno por eje), motivo (**obligatorio al reasignar**) | Historial de asignaciones | Coordinador asigna. Panel de avance por caso. Los técnicos ven «Mis casos» (filtrar por asignado). Solo se ofrecen técnicos activos de la misma UZDI. |
| RF-27 | **Informe técnico del adolescente** `/app/informes` | buscar adolescente → elegir tipo de informe y periodo → «Generar» | Registro en bitácora | Reúne **solo los registros a los que el rol tiene acceso** (nunca incluir fichas psicológicas si genera un T. Social, etc.). Vista imprimible/PDF (`@media print`). **Plantilla y firmante por definir** → dejar secciones configurables y un recuadro de firma vacío con la nota «Plantilla por definir con la Directora de la UZDI y el SNAI». Registra `generacion_informe` en la bitácora. Distinto del reporte estadístico (RF-16). |
| RF-22 | **Bitácora de seguridad** `/app/bitacora` | (solo lectura) filtros por usuario, tipo de evento y rango de fechas | La bitácora **no puede editarse ni borrarse** desde la interfaz | Solo Superadministrador. Muestra: inicios de sesión, modificaciones de usuarios, cambios de permisos, descargas de reportes y generación de informes. Tabla ordenada por fecha desc. Exportación y plazo de retención: **por definir** (botón deshabilitado con tooltip). |
| RF-09, 17–20 | **Catálogos de apoyo** `/app/catalogos` | cantones, provincias, nacionalidades, estados civiles, etnias | Desactivar valor | Una vista con pestañas. Administrador mantiene; T. Social consulta. **Provincia → cantón dependiente**: añadir `provincia_id` a cantón y filtrar el selector de cantón por provincia en el formulario del adolescente y de UZDI. Falta `/provincia` en el catálogo actual: agregarlo a `catalogo.service.ts`, `useCatalogos.ts` y al mock. Los selectores de formulario **solo ofrecen valores activos**. Si un catálogo no carga, avisar y **no permitir guardar el campo obligatorio vacío** (garantía mínima RF-09). |

**Criterio de aceptación Fase 2:** con cada uno de los 8 usuarios demo se puede ejecutar el flujo completo de sus módulos (crear → editar → dar de baja → verificar historial); cada acción relevante aparece en la bitácora del Superadministrador, sin nombres de adolescentes.

---

### FASE 3 — Requerimientos no funcionales (verificación y remate)

Recorre uno por uno y deja evidencia en `docs/CUMPLIMIENTO.md` (ver sección 7).

| RNF | Qué verificar en el frontend |
|---|---|
| 01 | Acceso solo con credenciales; contraseñas nunca visibles ni en logs; el token vive en `localStorage` solo por restricciones del prototipo (comentar riesgo; en producción preferir cookie `HttpOnly`). |
| 02 | Cada rol solo ve sus módulos; ruta bloqueada → mensaje informativo. |
| 03 | Bloqueo temporal tras intentos fallidos (valores desde Parámetros/pendientes). |
| 04 | **Cierre de sesión por inactividad**: composable `useInactividad.ts` (escucha mouse/teclado/touch); aviso 60 s antes con opción «Seguir conectado»; luego `logout()` y redirección a `/login` con mensaje. Tiempo desde Parámetros. Botón «Cerrar sesión» ya existe. |
| 05 | Confidencialidad por eje (ver sección 2). |
| 06 | Reportes agregados; ninguna pantalla pública/export expone nombre o imagen. No usar fotos de adolescentes en ningún lado. |
| 07 | Rectificar/actualizar datos sí; eliminar = baja lógica. |
| 08 | Eventos visibles en `bitacora`. |
| 09 | Mostrar «Creado por / Modificado por y cuándo» en el detalle de registros sensibles (adolescente, expediente, ficha, documento). |
| 10 | Validación de campos obligatorios y formatos (cédula, correo, fechas, números) y duplicados por cédula. |
| 11 | Catálogos vía `<select>`; nada de texto libre para nacionalidad, estado civil, etnia, cantón, provincia, GDO; ningún vínculo a un elemento inexistente o inactivo. |
| 12 | Estructura constante (listado, detalle, formulario), mensajes en español de confirmación/error. |
| 13 | Toda baja pide confirmación y explica su efecto. |
| 14 | WCAG 2.1 AA (contraste, teclado, labels, errores asociados al campo). Revisar con navegación solo por teclado. |
| 15 | Escritorio, tableta y teléfono sin scroll horizontal de página (probar 360, 768, 1280 px). |
| 16 | Skeletons en cargas; listados paginados; ninguna petición redundante (usar `useCatalogos` una sola vez por sesión). Métricas concretas: por definir. |
| 17 | Módulos construidos con `useCrud` + componentes reutilizables. |
| 18 | Excel y PDF funcionales. |
| 19 | Respaldo: no aplica al frontend; documentarlo como «responsabilidad del backend» en `CUMPLIMIENTO.md`. |
| 20 | Todo en español; sin textos en inglés visibles. |

---

## 5. Modelo de datos del mock (referencia rápida)

Convenciones: ids numéricos autoincrementales; FKs con sufijo `_id` (`adlc_id`, `uzdi_id`, `usr_id`…); fechas ISO `YYYY-MM-DD`; todos los registros de gestión llevan `activo: boolean`, `uzdi_id`, `creado_por`, `creado_en`, `modificado_por`, `modificado_en`.

Colecciones nuevas y sus rutas (prefijo `/api/v1`):

```
/gdo                     (ya existe como catálogo → pasa a CRUD con activo)
/provincia  /canton  /nacionalidad  /estado-civil  /etnia      (CRUD con activo)
/perfil                  RF-12
/permisos  /permisos/:perfilId   RF-10
/uzdi  /uzdi/:id         RF-11 (CRUD completo para Superadmin)
/representante  /vinculo-representante      RF-07/13
/contexto-familiar/intervencion  /contexto-familiar/ficha      RF-08
/ficha-psicologica       RF-06
/taller  /asistencia-taller     RF-14/15
/informacion-educativa   RF-24
/documento               RF-25
/alerta-salud            RF-26
/asignacion-caso         RF-23
/asignacion-medida       RF-05 (asignación por adolescente)
/informe-tecnico         RF-27 (POST genera; no persiste datos sensibles duplicados)
/bitacora                RF-22 (GET solo lectura; POST interno desde el adapter)
/parametros              RNF-03/04 (seguridad, notificaciones, organización)
```

El mock debe responder 409 en cédula duplicada, 404 en id inexistente, 403 cuando el rol del token no tenga permiso sobre la colección (usar la misma matriz que el frontend), y 400 con `{ message }` en validaciones.

---

## 6. Convenciones de código

- Vue 3 `<script setup lang="ts">`, Composition API, sin Options API.
- Un componente = una responsabilidad. Vistas ≤ ~350 líneas; si pasa, extraer formulario/tabla a `components/<modulo>/`.
- Estilos: usar las clases y variables de `design-system.css`. Estilos `scoped` solo para lo específico del módulo. **No cambiar la paleta** (azul sello `#25389B`, marcatexto `#F5D547`, estados verde/ámbar/carmesí). Tipografías ya configuradas.
- Nombres de archivos: `PascalCase.vue`, servicios `nombre.service.ts`, composables `useXxx.ts`.
- Tipado estricto: nada de `any` nuevo (el adapter mock ya usa `Row`; es la única excepción).
- Los errores de red deben dar mensaje al usuario por `useToast().error(...)`; no tragarse errores en silencio como hoy hacen algunos `catch {}` vacíos: **corrige los `catch` vacíos** que encuentres en vistas existentes mostrando un error o estado de error (`.errstate`).
- Estados de UI en todas las listas: cargando (`.sk`), vacío (`EmptyState`), error, sin resultados.
- No commitear `.env` con valores reales; mantener `.env.example` actualizado (nuevas variables si las hay).
- Mensajes de commit sugeridos: `feat(rf-06): ficha psicológica`, `fix(rbac): ...`.

---

## 7. Documentación a entregar

1. **`docs/CUMPLIMIENTO.md`**: tabla con cada RF-01…RF-27 y RNF-01…RNF-20 → estado (`Completo` / `Parcial` / `Simulado en mock` / `Depende del backend`) → archivo/pantalla donde se cumple. Sé honesto: lo simulado debe decir «simulado».
2. **`docs/PENDIENTES_SNAI.md`**: lista de todas las decisiones «por definir» y dónde están parametrizadas en el código (sección 8).
3. Actualizar **`README.md`**: nuevas rutas, matriz de roles, cómo correr el modo demo, usuarios demo (`superadmin`, `admin`, `coordinador`, `tsocial`, `psicologo`, `educador`, `juridico`, `tsocial.gye`; clave `Snai2026`).
4. Actualizar `REVISION.md` con los hallazgos resueltos.

---

## 8. Decisiones por validar (implementar como configurable, NO como verdad)

Crea `src/config/pendientes.ts` con estas constantes y úsalas desde ahí:

| Tema | Valor por defecto en demo | Origen |
|---|---|---|
| Intentos fallidos antes del bloqueo | 3 | RF-21 / RNF-03 — por definir con el SNAI |
| Duración del bloqueo | 5 min | RNF-03 — por definir |
| Inactividad para cerrar sesión | 30 min | RNF-04 — por definir |
| Caducidad de contraseña | 90 días | por definir |
| Días de anticipación de alertas de vencimiento | 7 | Parámetros |
| Retención y exportación de la bitácora | sin definir (botón deshabilitado) | RF-22 |
| Estructura de la ficha sociofamiliar | `representante`, `fecha`, `motivo`, `información complementaria` | RF-08 |
| Plantilla y firmante del informe técnico | secciones configurables, firma vacía | RF-27 |
| Niveles y estados educativos oficiales | lista de ejemplo | RF-24 |
| Alertas de salud incluidas en el alcance | `true` (flag) | RF-26 — la Directora/SNAI decide |
| Quién gestiona GDO / permisos / medidas | Admin / Superadmin / Jurídico | C-01, C-02, C-07 — ratificar con la Directora |
| Denominación oficial «UZDI» vs «Unidades de Desarrollo Integral» | «UZDI» (Unidad Zonal de Desarrollo Integral) | confirmar con el SNAI |
| Adjuntos en documentos | no (solo datos) | RF-25 — iteración posterior |

---

## 9. Qué NO hacer

- No implementar autenticación real, cifrado ni envío de correos: es simulación de frontend.
- No inventar artículos de ley ni citar normativa dentro de la interfaz.
- No mostrar datos reales ni usar fotos. Todos los datos son ficticios.
- No dejar botones sin función: si algo depende del backend o está por definir, el botón va deshabilitado con `title` que lo explique.
- No romper el modo `VITE_USE_MOCK=false` (la app debe seguir arrancando contra un backend real; las llamadas deben usar las mismas rutas que el mock).
- No renombrar `uzdi_token` / `uzdi_user` en `localStorage` ni las rutas existentes `/app/...`.
- No eliminar el diseño ni los tokens existentes.

---

## 10. Definición de «terminado»

- [ ] `npm install && npm run build` sin errores ni warnings de TypeScript.
- [ ] Los 8 usuarios demo ingresan y ven **solo** su menú de la sección 2.
- [ ] Cada RF-01…RF-27 tiene pantalla o comportamiento verificable (o está documentado como «depende del backend»).
- [ ] Ninguna acción de baja elimina datos; todas piden confirmación.
- [ ] La bitácora registra inicios de sesión, cambios de usuarios/permisos, descargas de reportes e informes, sin nombres de adolescentes.
- [ ] Reportes exportan a Excel y PDF y son solo agregados.
- [ ] Sesión se cierra por inactividad; login se bloquea tras intentos fallidos (con valores configurables).
- [ ] Formularios validan cédula, correo, teléfono, fechas y duplicados.
- [ ] Navegación completa por teclado y sin scroll horizontal en 360 px.
- [ ] `docs/CUMPLIMIENTO.md`, `docs/PENDIENTES_SNAI.md`, `README.md` y `.env.example` actualizados.

**Orden sugerido de ataque:** Fase 0 → RF-21 → RF-01 → RF-10/12/11 → RF-02/03/05 → catálogos y GDO → representantes/vínculos → fichas/contexto familiar/educación → talleres/asistencia → documentos/alertas → asignación de casos → reportes e informe técnico → bitácora → Fase 3.
