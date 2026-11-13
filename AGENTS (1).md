# AGENTS.md — Reglas permanentes del proyecto UZDI_FRONT_SNAI

> OpenCode carga este archivo en cada sesión. Estas reglas **siempre** aplican.
> El plan de trabajo detallado está en `PLAN_FRONTEND_UZDI.md` (raíz del proyecto).

## 1. Qué es este proyecto

Frontend del **Sistema SNAI para las Unidades Zonales de Desarrollo Integral (UZDI)** (Ecuador).
Gestiona adolescentes con medidas socioeducativas, por lo que **maneja datos sensibles de menores**.

- Stack: **Vue 3.5 + TypeScript + Vite**, `vue-router`, `axios`, `@lucide/vue`. Sin framework de UI.
- Estilos: `src/design-system.css` (tokens y clases globales) + estilos `scoped` por componente.
- No hay backend. Hoy todo corre contra un **adaptador mock de axios** (`src/services/mock/`) activado con `VITE_USE_MOCK=true`.
- Otro equipo (backend) conectará después. **Tu objetivo es dejar el frontend completo y con un contrato de API claro y aislado**, para que la unión sea cambiar una URL, no reescribir pantallas.

## 2. Comandos

```bash
npm install
npm run dev            # http://localhost:5174 (con VITE_USE_MOCK=true en .env)
npm run build          # vue-tsc -b && vite build  → DEBE pasar siempre
npx vue-tsc --noEmit   # verificación de tipos
```

## 3. Reglas innegociables

1. **NO modificar el diseño.** Colores, tipografías, espaciados, sombras, layout y estructura visual quedan exactamente como están.
   - No editar `src/design-system.css` salvo **añadir** clases nuevas estrictamente necesarias, usando solo tokens existentes (`var(--...)`). Cualquier adición se anota en `docs/CAMBIOS_CSS.md`.
   - No tocar los estilos `scoped` de componentes existentes salvo bug funcional.
   - Las pantallas nuevas **reutilizan** las clases y componentes existentes: `.page`, `.hero`, `.card`, `.tbl`, `.badge`, `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-sm`, `.f-ctl`, `.f-label`, `.f-err`, `.modal`, `.sk`, `.tool-search`, `.tool-select`, y los componentes de `src/components/ui/`.
   - Una pantalla nueva debe verse como hermana de `AdolescentesView.vue`. Copia su estructura de marcado.
2. **NO añadir dependencias** salvo las autorizadas en el plan (solo `xlsx`, y únicamente en la Fase 2). No cambiar versiones de las existentes.
3. **Toda la interfaz en español** (textos, mensajes de error, confirmaciones, `aria-label`). Identificadores de código: sigue la convención existente del archivo que editas.
4. **Aislar el contrato con el backend.** Los nombres de campos y rutas del backend viven **solo** en `src/services/*.service.ts` y sus tipos. Las vistas trabajan con modelos de vista, no con DTOs crudos. Si backend renombra un campo, debe cambiar **un solo archivo**.
5. **El mock debe poder borrarse sin romper nada.** El código de producción no importa nada de `src/services/mock/` salvo mediante la carga dinámica condicionada por `VITE_USE_MOCK`.
6. **No inventar.** No inventes artículos de ley, campos "oficiales", catálogos oficiales ni valores numéricos de seguridad. Si el plan dice **[ASUNCIÓN]** o **[PENDIENTE]**, impleméntalo como configuración fácil de cambiar y regístralo en `docs/DECISIONES_PENDIENTES.md`.
7. **Datos de menores.** Nunca imprimas datos de adolescentes en `console.log`. Los datos del mock son ficticios; no uses nombres reales. Nunca guardes contraseñas en `localStorage`/`sessionStorage`.
8. **Sin eliminación física.** Ningún flujo hace `DELETE` real de adolescentes, expedientes, usuarios, medidas, documentos ni de datos clínicos/sociales: se usa **baja lógica** (ver plan §3).
9. **Quirúrgico en lo existente.** Al modificar archivos que ya existen, haz cambios mínimos y verifica que el comportamiento previo siga funcionando.

## 4. Forma de trabajar

- Trabaja **por fases**, en el orden del plan. **No avances de fase** si `npm run build` falla.
- Al terminar cada fase: ejecuta `npm run build`, actualiza el checklist de progreso en `PLAN_FRONTEND_UZDI.md` (marca `[x]`) y resume en 5–10 líneas qué hiciste y qué decisiones tomaste.
- Si inicializaste git (`git init` si no existe), haz **un commit por fase** con mensaje en español: `fase N: <resumen>`.
- Si algo del plan contradice el código real, **gana el plan**, salvo que rompa la regla 1 (diseño): ahí gana el diseño existente. Anota la discrepancia en `docs/DECISIONES_PENDIENTES.md`.
- Ante duda razonable: elige la opción más conservadora, impleméntala configurable y regístrala. No te detengas a preguntar por detalles menores.

## 5. Definición de "terminado" (global)

- [ ] `npm run build` pasa sin errores ni warnings de TypeScript.
- [ ] Cada RF-01…RF-27 tiene ruta, vista y servicio (excepto lo marcado fuera de alcance).
- [ ] Los 8 usuarios demo muestran solo los módulos de su perfil, y las rutas prohibidas redirigen.
- [ ] Existen `docs/API_CONTRACT.md`, `docs/MATRIZ_PERMISOS.md`, `docs/DECISIONES_PENDIENTES.md`, `docs/INTEGRACION_BACKEND.md`.
- [ ] Cero diferencias visuales en las pantallas ya existentes.
