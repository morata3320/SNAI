# Pendientes por definir con el SNAI

Estos valores están parametrizados para no quedar como cifras o reglas fijas en la interfaz.

| Tema | Valor demo | Dónde se configura |
| --- | --- | --- |
| Intentos fallidos antes del bloqueo | 3 | `src/config/pendientes.ts`, `src/config/seguridad.ts` y `/parametros` |
| Duración del bloqueo | 5 minutos | `src/config/pendientes.ts`, `src/config/seguridad.ts` y `/parametros` |
| Inactividad para cerrar sesión | 30 minutos | `src/config/pendientes.ts`, `src/config/seguridad.ts` y `/parametros` |
| Caducidad de contraseña | 90 días | `src/config/pendientes.ts` |
| Días de anticipación de vencimientos | 7 días | `src/config/pendientes.ts` y Parámetros |
| Retención y exportación de bitácora | Sin definir | `src/config/pendientes.ts`; botón de exportación deshabilitado |
| Estructura de ficha sociofamiliar | Campos mínimos | `src/config/pendientes.ts` |
| Plantilla y firmante del informe técnico | Secciones configurables y firma vacía | `src/views/InformesView.vue` |
| Niveles y estados educativos | Lista de ejemplo | `src/entities/registry.ts` |
| Alertas de salud en el alcance | `true` en demo | `src/config/pendientes.ts` |
| Gestión de GDO, permisos y medidas | Admin / Superadmin / Jurídico | Matriz de `src/router/access.ts` |
| Denominación oficial UZDI | «UZDI» | Textos de la aplicación |
| Adjuntos en documentos | No disponibles | `src/entities/registry.ts`; iteración posterior |
| Bloqueo real de login | Simulado en frontend | Debe implementarse en backend |

También están pendientes de validación:

- Detalle de adolescente con pestañas por rol (RF-02).
- Autocompletar la fecha fin de una asignación de medida (RF-05).
- Atajo de asistencia por taller (RF-15).
- Exportación nativa a Excel (RF-16/RNF-18).
- Auditoría de accesibilidad y responsive en dispositivos reales.
