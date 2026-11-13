# Revisión del frontend UZDI_FRONT (equipo anterior) y versión con el estilo SNAI

Esta carpeta es una copia de `UZDI_FRONT.zip` con (1) las correcciones mínimas para que compile, (2) un modo demo sin backend y (3) el estilo visual del prototipo SNAI. Las pantallas, rutas, roles y servicios son los mismos del original.

## Hallazgos del original

| # | Hallazgo | Estado en esta carpeta |
|---|---|---|
| 1 | `package.json` solo declaraba `vue`; el código importa `vue-router`, `axios` y `@lucide/vue`. Un `npm install` limpio no compilaba. | Corregido |
| 2 | Con las dependencias instaladas, `npm run build` fallaba con 6 errores de TypeScript (imports sin uso, funciones sin usar, propiedad `uzdi_id` inexistente). | Corregido |
| 3 | **Error funcional:** la barra superior siempre mostraba "UZDI" porque `AppShell.vue` buscaba `u.uzdi_id` en un catálogo que expone `id`. | Corregido |
| 4 | **Error funcional:** un 401 en el propio login recargaba la página (interceptor de `api.ts`) y se perdía el mensaje "Credenciales inválidas". | Corregido |
| 5 | Falta `.env`: sin `VITE_API_BASE_URL` la URL quedaba `undefined/api/v1`. | `.env.example` + valor por defecto |
| 6 | Sin backend las vistas salen vacías; no se puede demostrar ni capturar. | Modo demo (`VITE_USE_MOCK=true`) |
| 7 | La tabla de niveles de acceso estaba duplicada en `router/index.ts` y `AppShell.vue`. | Unificada en `src/router/access.ts` |
| 8 | Los botones de exportar de Reportes existían como funciones pero no estaban en la pantalla. | Agregados (PDF por impresión; Excel pendiente de backend) |
| 9 | Nueve componentes no se usan en ninguna vista (`AdolescenteForm`, `ExpedienteForm`, `MedidaForm`, `FormPanel`, `ConfirmModal`, `EmptyState`, `PageHeader`, `SearchBar`, `StatusBadge`); algunos tienen listas de UZDI fijas. | Sin cambios (solo se les aplicaron los colores nuevos) |
| 10 | El formulario de expedientes (componente sin uso) ofrece estados `Abierto/En proceso/Cerrado`, pero el servicio y el panel usan `En proceso/Atraso/Incomparecencia`. | Sin cambios; conviene definir los estados oficiales |
| 11 | El original no tenía diseño responsivo (ninguna `@media`): en pantallas pequeñas el menú ocupaba el ancho. | Menú desplegable y tablas con desplazamiento |
| 12 | Alcance funcional menor al de los requerimientos: no hay permisos por perfil, GDOs ni consulta de UZDIs como módulos. | Sin cambios (decisión del equipo) |
| 13 | README del original describe 3 roles; el código maneja 8 `tppr_id` con 3 niveles de acceso. | Documentado aquí |
| 14 | El contador de intentos de login es solo del navegador; el bloqueo real debe hacerlo el backend. | Sin cambios |

## Cambios de estilo (solo capa visual)

- `src/design-system.css` reescrito con los tokens del prototipo: papel `#EDF0F4`, azul de sello `#25389B`, marcatexto `#F5D547` como único acento, estados verde/ámbar/carmesí. Se conservaron los nombres de variables y clases.
- Tipografía: Bricolage Grotesque (títulos) y Atkinson Hyperlegible Next (texto), desde Google Fonts con fuentes del sistema como respaldo.
- Menú lateral claro con el ítem activo resaltado; franja de cifras en el inicio; tablas sobre el papel con marca de estado a la izquierda; ventanas con la pestaña marcatexto ("carpeta del caso"); login con panel azul y pestaña.
- Estilos `scoped` de 18 componentes y vistas actualizados a los mismos tokens.

## Modo demo

`.env` con `VITE_USE_MOCK=true` activa un adaptador de axios (`src/services/mock/`) que responde en memoria a las mismas rutas que el backend. Usuarios (contraseña `Snai2026`): `superadmin`, `admin`, `coordinador`, `tsocial`, `psicologo`, `educador`, `juridico`, `tsocial.gye`. Los datos se reinician al recargar. Con `VITE_USE_MOCK=false` la aplicación usa el backend real.

## Cómo ejecutar

```bash
npm install
npm run dev      # http://localhost:5174
npm run build    # vue-tsc + vite build
```
