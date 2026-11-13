# Estado de publicación y despliegue — UZDI/SNAI

**Fecha de corte:** 13 de noviembre de 2026  
**Repositorio destino:** https://github.com/morata3320/SNAI  
**Backend real:** https://uzdi-backend-api.onrender.com/api/v1

## Estado comprobado

- El frontend usa Vue 3, TypeScript, Vite y Axios.
- La configuración de producción utiliza `VITE_USE_MOCK=false`.
- La URL de Axios apunta a la API pública de Render sin duplicar `/api/v1`.
- Las operaciones HTTP DELETE permanecen bloqueadas con `VITE_ENABLE_DELETE=false`.
- El repositorio no incluye `.env`, `node_modules` ni `dist`.
- GitHub Pages está configurado para la subruta `/SNAI/` y usa router hash.
- La compilación CI se ejecuta en cada push. El despliegue Pages queda condicionado a la variable `ENABLE_GITHUB_PAGES=true` después de habilitar Pages en la configuración del repositorio.
- `render.yaml` configura un Static Site con publicación desde `dist` y fallback SPA.

## Validaciones

| Validación | Estado |
| --- | --- |
| TypeScript | Correcto |
| Build de producción | Correcto |
| Health del backend | HTTP 200 |
| OpenAPI | HTTP 200; 63 rutas y 141 operaciones |
| CORS localhost | Preflight login/JWT HTTP 204; origen permitido |
| CORS GitHub Pages | Preflight login/JWT HTTP 204 para `morata3320.github.io` |
| Rutas frontend auditadas | 30/30 presentes en OpenAPI |
| DTO documentados | Pendiente: 55/55 esquemas publicados sin propiedades |
| Login real | Pendiente de credenciales autorizadas |
| CRUD autenticados | Pendiente de credenciales y permisos del backend |
| Escrituras contra producción | No ejecutadas |

## Incidencias dependientes del backend

1. Swagger publica los DTO con `properties: {}`, por lo que no permite validar íntegramente los cuerpos POST/PATCH.
2. Las pruebas autenticadas anteriores reportaron HTTP 403 por asignación de perfil; no se considera resuelto sin una nueva prueba autorizada.
3. No está confirmado que DELETE implemente baja lógica; se mantiene deshabilitado.
4. Varios módulos del prototipo no tienen endpoints en Render y se ocultan en producción.

## Render

El repositorio queda preparado mediante `render.yaml`. El servicio debe crearse como **Static Site** desde el Blueprint o desde el panel de Render. No se ha creado ni modificado el backend `uzdi-backend-api` ni una base PostgreSQL.

La URL pública del frontend se añadirá únicamente después de que Render complete y se verifique el despliegue HTTPS.

GitHub Pages tampoco se considera publicado todavía: GitHub rechazó que el token inicial de Actions creara el sitio automáticamente. Esta limitación no afecta al código subido ni a la compilación, que sí terminó correctamente en Ubuntu.

## Evidencias

- `docs/INTEGRACION_BACKEND_REAL.md`: auditoría de endpoints y módulos.
- `INTEGRACION_RENDER.md`: configuración y lista de comprobación.
- `scripts/smoke-api.mjs`: prueba no destructiva de Health, OpenAPI y GET autenticados opcionales.
- `scripts/audit-openapi.mjs`: comprobación automatizada del contrato.
- `uzdi-public-check-v2.mjs`: prueba pública de Health y CORS sin credenciales.
