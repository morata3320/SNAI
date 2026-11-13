# Cumplimiento de requerimientos — UZDI Frontend

Fecha de corte: noviembre 2026. Estado verificado con `npm.cmd run build`.

## Requerimientos funcionales

| RF | Estado | Evidencia / observación |
| --- | --- | --- |
| RF-01 Usuarios | Completo (mock) | `UsuariosView.vue`, `usuario.service.ts`; cédula, cargo, UZDI, baja lógica y reset de clave. |
| RF-02 Adolescentes | Parcial | `AdolescentesView.vue`; CRUD, validaciones, provincia → cantón y baja lógica. Falta detalle de solo lectura con pestañas por rol. |
| RF-03 Expedientes | Completo (mock) | `ExpedientesView.vue`, `expediente.service.ts`; campos judiciales, estados y cierre con fecha. |
| RF-04 GDO | Completo (mock) | Módulo declarativo `gdos` en `entities/registry.ts` y `ModuleView.vue`. |
| RF-05 Medidas | Parcial | Catálogo y asignaciones en `MedidasView.vue`/`ModuleView.vue`. La fecha fin estimada aún no se autocalcula desde la duración. |
| RF-06 Fichas psicológicas | Completo (mock) | Módulo `fichas`, visible solo para Psicólogo y Coordinador. |
| RF-07 Representantes | Completo (mock) | `RepresentantesView.vue`; varios representantes por adolescente. |
| RF-08 Contexto familiar | Completo (mock) | `ContextoFamiliarView.vue`; estructura de ficha marcada como configurable/por definir. |
| RF-09 Catálogos | Completo (mock) | `CatalogosView.vue`; provincia → cantón implementado en adolescentes y UZDI. |
| RF-10 Permisos | Completo (mock) | `PermisosView.vue`; matriz por rol y aviso de aplicación en el siguiente ingreso. |
| RF-11 UZDI | Completo (mock) | Módulo `uzdi`; alcance por UZDI aplicado en el adapter. |
| RF-12 Perfiles | Completo (mock) | Módulo `perfiles`; perfiles base protegidos. |
| RF-13 Vínculos | Parcial | Vínculos dentro de `RepresentantesView.vue`; falta pestaña de historial dedicada. |
| RF-14 Talleres | Completo (mock) | Módulo `talleres` con validación de horario en el registro declarativo. |
| RF-15 Asistencia | Parcial | Módulo `asistencia-talleres`; falta atajo de toma de asistencia por taller. |
| RF-16 Reportes | Completo (mock) | `ReportesView.vue`; filtros reales, tipos por rol, CSV y PDF con bitácora. |
| RF-17–20 Catálogos de apoyo | Completo (mock) | `CatalogosView.vue` + servicios de catálogo; solo valores activos en formularios. |
| RF-21 Ingreso | Completo (simulado) | `LoginView.vue`; bloqueo configurable y cuenta regresiva. El bloqueo real depende del backend. |
| RF-22 Bitácora | Completo (mock) | `BitacoraView.vue`; solo lectura, filtros y sin baja. Exportación/retención deshabilitadas por definir. |
| RF-23 Asignación de casos | Completo (mock) | Módulo `asignacion-casos`; historial y motivo obligatorio. |
| RF-24 Educación | Completo (mock) | Módulo `educacion`; estados educativos configurables. |
| RF-25 Documentos | Completo (mock) | Módulo `documentos`; archivo lógico, sin adjuntos en esta iteración. |
| RF-26 Alertas de salud | Completo (mock) | Módulo `alertas-salud`; flag en `config/pendientes.ts`, descripción solo en detalle. |
| RF-27 Informe técnico | Completo (mock) | `InformesView.vue`; secciones por rol, impresión y plantilla marcada por definir. |

## Requerimientos no funcionales

| RNF | Estado | Evidencia / observación |
| --- | --- | --- |
| 01 Autenticación | Completo (simulado) | Token y usuario en `localStorage`; contraseñas nunca visibles. En producción se recomienda cookie `HttpOnly`. |
| 02 Control de acceso | Completo | `router/access.ts`, guard del router, menú y acciones filtradas por rol. |
| 03 Bloqueo de login | Simulado | `LoginView.vue`, `config/seguridad.ts`; el bloqueo definitivo corresponde al backend. |
| 04 Inactividad | Completo | `useInactividad.ts`; aviso, extensión y cierre de sesión configurables. |
| 05 Confidencialidad por eje | Completo | Matriz RBAC y rutas protegidas; fichas, salud, familia y documentos restringidos. |
| 06 Reportes agregados | Completo | `ReportesView.vue` no expone nombre, cédula ni imagen de adolescentes. |
| 07 Baja lógica | Completo | Confirmaciones y `DELETE` del mock con `activo=false`/estado, sin borrado físico. |
| 08 Trazabilidad | Completo (mock) | `BitacoraView.vue`; escrituras y descargas registran eventos sin nombres de adolescentes. |
| 09 Auditoría de registros | Parcial | Campos `creado_por`/`modificado_por` en mock; no todas las vistas muestran el detalle. |
| 10 Validaciones | Completo | `utils/validators.ts`; cédula, correo, teléfono, fechas y duplicados. |
| 11 Catálogos | Completo | Selectores desde catálogo; sin texto libre para valores normados. |
| 12 Consistencia de UI | Completo | Patrón listado → formulario → confirmación y mensajes en español. |
| 13 Confirmación de bajas | Completo | Modales `ConfirmModal` y textos de conservación de historial. |
| 14 Accesibilidad | Parcial | Labels, `aria-label`, errores y foco en formularios; falta auditoría completa con teclado/lector. |
| 15 Responsive | Parcial | Tablas con scroll y menú colapsable; falta prueba visual en 360/768/1280 px. |
| 16 Rendimiento | Parcial | Catálogos cacheados y listados paginados; no hay métricas ni medición formal. |
| 17 Reutilización | Parcial | `ModuleView`/`ModulePanel` y utilidades compartidas; vistas antiguas no usan `useCrud`. |
| 18 Exportaciones | Parcial | CSV con BOM y PDF por impresión; no se agregó `xlsx`. |
| 19 Respaldo | Depende del backend | No aplica al frontend. |
| 20 Idioma | Completo | Textos visibles y mensajes en español. |

## Verificación

```powershell
npm.cmd run build
```

Resultado del último corte: compilación correcta (`vue-tsc` + `vite build`).
