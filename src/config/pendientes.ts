// Decisiones que el informe de requerimientos deja «por definir con el SNAI».
// Todos los valores viven aquí (o en Parámetros) para poder cambiarlos sin tocar la lógica.
// POR DEFINIR CON EL SNAI

export const PENDIENTES = {
  /** Intentos fallidos consecutivos antes del bloqueo temporal (RF-21 / RNF-03). */
  intentosLogin: 3, // POR DEFINIR CON EL SNAI
  /** Duración del bloqueo temporal en minutos (RNF-03). */
  duracionBloqueoMin: 5, // POR DEFINIR CON EL SNAI
  /** Minutos de inactividad antes de cerrar la sesión (RNF-04). */
  inactividadMin: 30, // POR DEFINIR CON EL SNAI
  /** Días de vigencia de una contraseña (RNF-03). */
  caducidadClaveDias: 90, // POR DEFINIR CON EL SNAI
  /** Días de anticipación para avisar vencimientos de medidas (Parámetros). */
  diasAnticipacion: 7, // POR DEFINIR CON EL SNAI
  /** Aviso de inactividad: segundos antes del cierre automático. */
  avisoInactividadSeg: 60,
} as const

/** Interruptor de funcionalidades cuya inclusión aún debe ratificarse con el SNAI. */
export const FEATURES = {
  /** RF-26: las alertas de salud son categoría especial; la Directora/SNAI decide si entran. */
  alertasSalud: true, // POR DEFINIR CON EL SNAI
  /** RF-25: adjuntos de documentos quedan para una iteración posterior. */
  adjuntosDocumentos: false, // POR DEFINIR CON EL SNAI
} as const

/**
 * Estructura de la ficha sociofamiliar (RF-08).
 * El informe solo fija «representante, fecha, motivo» + información complementaria.
 * POR DEFINIR CON EL SNAI — ampliar este arreglo cuando la Directora de la UZDI valide los campos.
 */
export const FICHA_SOCIOFAMILIAR_CAMPOS = [
  { key: 'representante', label: 'Representante', tipo: 'representante' },
  { key: 'fecha', label: 'Fecha', tipo: 'fecha' },
  { key: 'motivo', label: 'Motivo', tipo: 'texto' },
  { key: 'informacion', label: 'Información complementaria', tipo: 'area' },
] as const

/**
 * Secciones del informe técnico del adolescente (RF-27).
 * La plantilla y el firmante definitivos están por definir con la Directora de la UZDI y el SNAI.
 */
export const INFORME_TECNICO_SECCIONES = [
  'Datos de identificación',
  'Motivo del informe',
  'Antecedentes familiares',
  'Situación educativa',
  'Proceso psicológico',
  'Cumplimiento de medida',
  'Documentos y actuaciones',
  'Conclusiones y recomendaciones',
] as const

/** Niveles educativos de ejemplo (RF-24). POR DEFINIR CON EL SNAI. */
export const NIVELES_EDUCATIVOS = [
  'Educación inicial',
  'Educación general básica',
  'Bachillerato',
  'Bachillerato técnico',
  'Nivelación',
  'Educación superior',
] as const

/** Estados educativos de ejemplo (RF-24). POR DEFINIR CON EL SNAI. */
export const ESTADOS_EDUCATIVOS = ['Matriculado', 'Nivelación', 'Graduado', 'Retirado'] as const

/** Temas de taller de ejemplo; la lista es editable por Psicología/Educación (RF-14). */
export const TEMAS_TALLER = [
  'Autoestima',
  'Habilidades sociales',
  'Proyecto de vida',
  'Manejo de emociones',
  'Prevención de consumo',
  'Convivencia familiar',
] as const

/** Tipos de documento habilitante (RF-25). */
export const TIPOS_DOCUMENTO = ['Oficio', 'Informe técnico', 'Resolución', 'Acta', 'Notificación'] as const

/** Tipos de alerta de salud (RF-26). POR DEFINIR CON EL SNAI. */
export const TIPOS_ALERTA_SALUD = [
  'Salud mental',
  'Medicación',
  'Enfermedad crónica',
  'Control médico',
  'Consumo problemático',
] as const

/** Estados de una alerta de salud (RF-26). */
export const ESTADOS_ALERTA_SALUD = ['Pendiente', 'En seguimiento', 'Atendida'] as const

/** Ejes de atención usados en la asignación de casos (RF-23). */
export const EJES_ATENCION = ['Social', 'Psicológico', 'Educativo', 'Jurídico'] as const

/** Tipos de ficha psicológica (RF-06). */
export const TIPOS_FICHA_PSICOLOGICA = [
  'Evaluación inicial',
  'Seguimiento psicológico',
  'Intervención en crisis',
] as const

/** Parentescos admitidos para representantes (RF-07). */
export const PARENTESCOS = [
  'Madre',
  'Padre',
  'Abuelo/a',
  'Tío/a',
  'Hermano/a',
  'Tutor/a legal',
] as const
