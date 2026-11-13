# Cambios: prototipo UZDI con la paleta del SNAI

- `src/design-system.css`: tokens nuevos (navy #0f172a, azules #1e3a8a/#1d4ed8/#2563eb, cielo #38bdf8, slate, estados verde/naranja/rojo, ámbar #fbbf24 como detalle) y una "CAPA SNAI" al final con el acabado visual (menú, cabeceras degradadas, tablas, botones, modales, formularios).
- `src/views/LoginView.vue`: panel de marca con degradado, pestaña de logo blanca, botón con degradado.
- `src/layouts/AppShell.vue`: botón de cerrar sesión también en la barra superior.
- `src/views/DashboardView.vue`: colores de la dona (verde/naranja/rojo del SNAI).
- Formularios (`AdolescenteForm`, `ExpedienteForm`, `MedidaForm`, `ReportParams`): foco azul SNAI.
- `index.html`: tipografía Inter.
- Menú lateral compactado para que entre completo en pantallas de 1280x720.

Para ejecutar: `npm install` y `npm run dev` (puerto 5174). El `.env` trae `VITE_USE_MOCK=true` (datos de demostración).
