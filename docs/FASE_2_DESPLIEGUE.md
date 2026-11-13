# Fase 2 — Publicación del frontend UZDI/SNAI

## Git y destino

- La carpeta recibida no tenía metadatos `.git`.
- Repositorio autorizado: `morata3320/SNAI`.
- Cuenta conectada: `morata3320`.
- Permiso comprobado: administración y push.
- El repositorio estaba vacío antes de esta publicación.
- Rama de publicación: `main`.

## Configuración de producción

| Variable | Valor |
| --- | --- |
| `VITE_API_URL` | `https://uzdi-backend-api.onrender.com/api/v1` |
| `VITE_USE_MOCK` | `false` |
| `VITE_ENABLE_DELETE` | `false` |
| Render | History mode, `base=/`, rewrite a `/index.html` |
| GitHub Pages | Hash mode, `base=/SNAI/` |

## CORS y red pública

La comprobación `uzdi-public-check-v2.mjs` prueba, sin login ni datos personales:

- Health y OpenAPI.
- Preflight de login desde `http://localhost:5174` y `https://morata3320.github.io`.
- Preflight JWT de `/users` desde los mismos orígenes.

Los resultados ejecutados se registran en el reporte final de publicación. Estas pruebas no demuestran login ni CRUD.

Resultado del 13 de noviembre de 2026:

| Origen | Login `OPTIONS` | JWT `/users` `OPTIONS` | Resultado |
| --- | ---: | ---: | --- |
| `http://localhost:5174` | 204 | 204 | `Access-Control-Allow-Origin` coincide; permitido |
| `https://morata3320.github.io` | 204 | 204 | `Access-Control-Allow-Origin` coincide; permitido |

El backend anunció `GET, POST, PATCH, PUT, DELETE, OPTIONS` y permitió `Content-Type` y `Authorization`. No se enviaron credenciales ni se ejecutaron escrituras.

## Matriz funcional

| Área | Implementado | Probado sin login | Pendiente por credenciales/backend |
| --- | --- | --- | --- |
| Configuración Axios/Render | Sí | Sí | — |
| Login JWT | Sí | Endpoint disponible | Respuesta y perfil reales |
| Dashboard | Sí | Compila | Datos autenticados |
| Usuarios | Sí | Contrato presente | GET/POST/PATCH autorizados |
| Catálogos y UZDI | Sí | Contrato presente | Lecturas con perfil real |
| Adolescentes | Sí | Contrato presente | CRUD autorizado |
| Expedientes y medidas | Sí | Contrato presente | CRUD autorizado |
| Reportes Excel/PDF | Sí | Contrato presente | Descarga autenticada |
| Módulos sin endpoint | Ocultos en producción | Sí | Implementación del backend |

## Publicación y despliegue

- GitHub Actions compila con mock desactivado en cada push. La publicación de `dist` se activa con la variable de repositorio `ENABLE_GITHUB_PAGES=true` una vez que Pages esté habilitado.
- `render.yaml` define un Static Site independiente; no modifica el backend ni PostgreSQL.
- No se publica una URL de Render hasta verificar un despliegue real.
