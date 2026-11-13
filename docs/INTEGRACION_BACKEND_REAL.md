# Informe de integración con el backend real UZDI/SNAI

**Fecha de auditoría:** 12 de noviembre de 2026  
**API:** `https://uzdi-backend-api.onrender.com/api/v1`  
**OpenAPI:** `https://uzdi-backend-api.onrender.com/api/docs-json`

## Resultado ejecutivo

El frontend queda configurado con `VITE_USE_MOCK=false` y la URL de Render. Se centralizó el contrato HTTP, se corrigieron las rutas que no coincidían con OpenAPI y se impidió que los módulos exclusivos del simulador aparezcan como funcionalidades reales.

El archivo solicitado `PROMPT_MAESTRO_INTEGRACION_UZDI_SNAI.md` no estaba presente en la raíz ni en el árbol `C:\Users\NW\Desktop\SNAI` durante esta ejecución. Se aplicaron como especificación la solicitud de integración recibida, `AGENTS.md`, el contrato OpenAPI vivo y la arquitectura existente.

La API y la documentación están disponibles: Health respondió HTTP 200 y OpenAPI respondió HTTP 200. Sin credenciales autorizadas, los endpoints de negocio auditados respondieron HTTP 401, por lo que no se leyeron datos personales ni se ejecutaron escrituras.

La limitación principal está en el contrato publicado: OpenAPI contiene **63 rutas, 141 operaciones y 55 esquemas**, pero los **55 esquemas DTO tienen `properties: {}`**. Por ello Swagger confirma rutas y métodos, pero no permite comprobar nombres, tipos, obligatoriedad o ejemplos de los cuerpos. Los payloads existentes se mantienen aislados en servicios y quedan pendientes de una prueba real autorizada.

## Auditoría de endpoints

| Grupo OpenAPI | Operaciones | Integración frontend |
| --- | ---: | --- |
| Health | 1 | Verificado HTTP 200 |
| Auth | 3 | Login JWT, logout y cambio de contraseña |
| Users | 6 | Listado, búsqueda, detalle, creación y edición; DELETE protegido |
| Provincia / Cantón / UZDI | 15 | Catálogos geográficos y mantenimiento UZDI |
| Perfil / Acción / Permiso | 15 | Perfiles disponibles; matriz editable no inferida por DTO vacío |
| Persona / Sesión / Historial | 15 | Historial conectado como bitácora de solo lectura |
| Nacionalidad / Estado civil / Etnia / GDO | 20 | Catálogos conectados |
| Infracción | 6 | Catálogo y relación con expedientes |
| Medida socioeducativa | 6 | Catálogo y consulta de expedientes relacionados |
| Adolescente | 5 | CRUD conectado; DELETE deshabilitado preventivamente |
| Expediente | 5 | CRUD y cierre por PATCH |
| Medida expediente | 5 | Asignaciones conectadas a `/medida-expediente` |
| Tipo parentesco / Representante / Adolescente representante | 15 | Representantes y vínculos conectados |
| Taller / Asistencia taller | 10 | Talleres y asistencia conectados |
| Tipo documento / Documento expediente | 10 | Documentos conectados a `/documento-expediente` |
| Reportes | 4 | Resúmenes y descargas Excel/PDF con filtros documentados |

## Módulos del frontend

| Módulo | Estado contra Render | Endpoints principales |
| --- | --- | --- |
| Login y sesión | Implementado; pendiente credencial real | `/auth/login`, `/auth/logout`, `/auth/change-password` |
| Dashboard | Implementado con lecturas autorizadas según rol | `/adolescente`, `/expediente`, `/taller`, `/historial` |
| Usuarios | CRUD preparado; no probado con datos reales | `/users` |
| Provincias, cantones y UZDI | CRUD preparado; no probado con datos reales | `/provincia`, `/canton`, `/uzdi` |
| Catálogos y GDO | CRUD/consulta preparados | `/nacionalidad`, `/estado-civil`, `/etnia`, `/gdo`, `/infraccion` |
| Adolescentes | CRUD preparado; no probado con datos reales | `/adolescente` |
| Expedientes | CRUD y cierre preparados | `/expediente` |
| Medidas | Catálogo y asignación preparados | `/medida-socioeducativa`, `/medida-expediente` |
| Representantes | CRUD y vínculos preparados | `/representante`, `/adolescente-representante`, `/tipo-parentesco` |
| Talleres | CRUD y asistencia preparados | `/taller`, `/asistencia-taller` |
| Documentos | CRUD preparado | `/tipo-documento`, `/documento-expediente` |
| Reportes | Endpoints reales corregidos; Excel/PDF binarios | `/reportes/...` |
| Bitácora | Lectura conectada | `/historial` |
| Permisos | Parcial | `/permiso` existe, pero sus DTO no tienen propiedades; se muestra la matriz local solo como referencia no editable |
| Parámetros, fichas psicológicas, contexto familiar, educación, alertas de salud, asignación de casos e informes técnicos | No disponibles en Render | Se ocultan en modo real; siguen disponibles únicamente con `VITE_USE_MOCK=true` |

## Correcciones contractuales aplicadas

- `/reports/*` se corrigió a `/reportes/*`.
- `/asignacion-medida` se corrigió a `/medida-expediente`.
- `/vinculo-representante` se corrigió a `/adolescente-representante`.
- `/documento` se corrigió a `/documento-expediente`.
- `/bitacora` se corrigió a `/historial`.
- `/directorio` se sustituyó por una proyección defensiva de `/users`.
- El restablecimiento `/users/{id}/reset-password` se ocultó en modo real porque no existe en OpenAPI.
- `/permisos/{rol}` se conserva solo para el mock; Render publica `/permiso` con DTO vacío.
- Las descargas institucionales envían los filtros OpenAPI confirmados (`uzdi_id`, `prov_id`, `cntn_id`, `estado_procesal`).
- El adaptador mock se carga dinámicamente y no se incluye como dependencia directa del cliente real.
- Se eliminan campos con nombres de secreto antes de persistir el usuario de sesión.

## Pruebas ejecutadas

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Correcto |
| `npm run build` | Correcto (línea base; repetir al cierre) |
| `npm run test:api` | Correcto: Health 200 y OpenAPI 200, sin credenciales ni escrituras |
| `npm run audit:openapi` | Verifica que las 30 rutas usadas por la integración existan en OpenAPI |

## Fallos o carencias detectados en backend/documentación

1. Los 55 DTO de Swagger no publican propiedades, tipos, campos obligatorios ni ejemplos.
2. No existe `GET /auth/me`; el frontend obtiene el perfil desde la respuesta de login y los claims JWT.
3. No existe un endpoint documentado para restablecimiento administrativo de contraseña.
4. No existen endpoints para parámetros, fichas psicológicas, contexto familiar, información educativa, alertas de salud, asignación de casos o informe técnico.
5. La documentación solo declara seguridad JWT explícita en Reportes, aunque las lecturas de negocio respondieron 401 sin token.
6. No está documentado si `DELETE` realiza baja lógica. Permanece bloqueado con `VITE_ENABLE_DELETE=false`.

## Pendiente de prueba real autorizada

- Confirmar la forma exacta de la respuesta de login, usuario, roles y UZDI.
- Confirmar los campos reales de cada DTO mediante un OpenAPI corregido o ejemplos oficiales.
- Ejecutar los GET autenticados del script `test:api` con credenciales de prueba autorizadas.
- Probar POST/PATCH únicamente con registros de prueba y autorización expresa.
- Confirmar que los filtros y el alcance por UZDI se aplican en el servidor.
- Confirmar los nombres de archivo, MIME y contenido de las exportaciones Excel/PDF.

