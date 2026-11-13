// Registro declarativo de módulos CRUD simples.
// Cada definición alimenta ModulePanel: columnas, formulario, búsqueda y permisos.
import type { ModuleId } from '../router/access'
import type { RefSource } from '../composables/useReferencias'
import {
  ESTADOS_ALERTA_SALUD,
  ESTADOS_EDUCATIVOS,
  EJES_ATENCION,
  NIVELES_EDUCATIVOS,
  PARENTESCOS,
  TEMAS_TALLER,
  TIPOS_ALERTA_SALUD,
  TIPOS_DOCUMENTO,
  TIPOS_FICHA_PSICOLOGICA,
} from '../config/pendientes'
import {
  fechaFinNoAnterior,
  formatFecha,
  requerido,
  validarTelefonoEC,
} from '../utils/validators'
import { ENDPOINTS } from '../services/backend-contract'

export interface Registro {
  id: number
  [key: string]: unknown
}

export type TipoCampo =
  | 'text' | 'email' | 'tel' | 'textarea' | 'number'
  | 'date' | 'time' | 'select' | 'checkbox' | 'ref'

export interface CampoDef {
  key: string
  label: string
  type?: TipoCampo
  required?: boolean
  options?: readonly string[]
  ref?: RefSource
  hint?: string
  placeholder?: string
  ancho?: 'full'
  validate?: (value: unknown, form: Record<string, unknown>) => string
}

export type TonoBadge = 'green' | 'amber' | 'red' | 'blue' | 'slate'

export interface ColumnaDef {
  key: string
  label: string
  value: (row: Registro) => string
  badge?: (row: Registro) => TonoBadge
  align?: 'left' | 'center' | 'right'
  width?: string
}

export interface ModuloDef {
  id: ModuleId
  path: string
  title: string
  subtitle: string
  singular: string
  fields: CampoDef[]
  columns: ColumnaDef[]
  searchKeys: string[]
  /** La baja lógica cambia de nombre según el módulo (retirar, archivar…). */
  bajaLabel?: string
  bajaAviso?: string
  /** Aviso de confidencialidad visible en la cabecera. */
  aviso?: string
}

const vacio = '—'

function texto(row: Registro, key: string): string {
  const valor = row[key]
  if (valor === null || valor === undefined || valor === '') return vacio
  return String(valor)
}

function fecha(row: Registro, key: string): string {
  return formatFecha(row[key] as string | null | undefined)
}

function refTexto(row: Registro, key: string): string {
  const valor = row[key]
  if (!valor || typeof valor !== 'object') return vacio
  const obj = valor as Record<string, unknown>
  const nombre = `${String(obj.nombre ?? '')} ${String(obj.apellido ?? '')}`.trim()
  if (nombre) return nombre
  if (obj.num_causa) return String(obj.num_causa)
  if (obj.login) return `${String(obj.nombre ?? '')} (${String(obj.login)})`
  return vacio
}

function siNo(valor: unknown): string {
  return valor ? 'Sí' : 'No'
}

function badgeActivo(row: Registro): TonoBadge {
  return row.activo === false ? 'slate' : 'green'
}

function badgeEstado(verde: string[], ambar: string[], rojo: string[]) {
  return (row: Registro): TonoBadge => {
    const estado = String(row.estado ?? '')
    if (rojo.includes(estado)) return 'red'
    if (ambar.includes(estado)) return 'amber'
    if (verde.includes(estado)) return 'green'
    return 'blue'
  }
}

const validarTelefono = (v: unknown): string =>
  !v || validarTelefonoEC(String(v)) ? '' : 'Ingrese un teléfono válido (09XXXXXXXX o 0X XXXXXXX).'

const validarFin = (v: unknown, form: Record<string, unknown>): string =>
  fechaFinNoAnterior(String(form.fecha_inicio ?? ''), String(v))
    ? ''
    : 'La fecha de fin no puede ser anterior a la fecha de inicio.'

const campoActivo: ColumnaDef = { key: 'activo', label: 'Estado', value: (r) => (r.activo === false ? 'Inactivo' : 'Activo'), badge: badgeActivo }

// ── Gestión: GDO (RF-04) ───────────────────────────────────────
export const GDO: ModuloDef = {
  id: 'gdos',
  path: ENDPOINTS.gdo,
  title: 'Grupos de desarrollo organizacional',
  subtitle: 'Catálogo de GDO. Solo los grupos activos se ofrecen en nuevos registros.',
  singular: 'el GDO',
  bajaLabel: 'Desactivar GDO',
  bajaAviso: 'El GDO dejará de ofrecerse en nuevos registros; los adolescentes vinculados conservan su historial.',
  searchKeys: ['nombre', 'descripcion'],
  fields: [
    { key: 'nombre', label: 'Nombre del grupo', required: true, placeholder: 'Ej. GDO Alfa' },
    { key: 'descripcion', label: 'Descripción', type: 'textarea', ancho: 'full' },
  ],
  columns: [
    { key: 'nombre', label: 'GDO', value: (r) => texto(r, 'nombre') },
    { key: 'descripcion', label: 'Descripción', value: (r) => texto(r, 'descripcion') },
    campoActivo,
  ],
}

// ── RF-07 / RF-13: representantes y vínculos ───────────────────
export const REPRESENTANTE: ModuloDef = {
  id: 'representantes',
  path: ENDPOINTS.representante,
  title: 'Representantes y familiares',
  subtitle: 'Un representante puede vincularse a varios adolescentes (hermanos).',
  singular: 'el representante',
  bajaLabel: 'Desactivar representante',
  bajaAviso: 'El representante y sus vínculos dejarán de ofrecerse; el historial se conserva.',
  searchKeys: ['nombres', 'apellidos', 'telefono', 'direccion'],
  fields: [
    { key: 'nombres', label: 'Nombres', required: true },
    { key: 'apellidos', label: 'Apellidos', required: true },
    { key: 'parentesco', label: 'Parentesco', type: 'select', options: PARENTESCOS, required: true },
    { key: 'telefono', label: 'Teléfono', type: 'tel', required: true, validate: validarTelefono },
    { key: 'direccion', label: 'Dirección', required: true, ancho: 'full' },
  ],
  columns: [
    { key: 'nombres', label: 'Representante', value: (r) => `${texto(r, 'nombres')} ${texto(r, 'apellidos')}` },
    { key: 'parentesco', label: 'Parentesco', value: (r) => texto(r, 'parentesco') },
    { key: 'telefono', label: 'Teléfono', value: (r) => texto(r, 'telefono') },
    { key: 'adolescentes', label: 'Adolescentes vinculados', value: (r) => {
      const lista = r['adolescentes']
      return Array.isArray(lista) && lista.length ? String(lista.length) : 'Sin vínculos'
    } },
    campoActivo,
  ],
}

export const VINCULO: ModuloDef = {
  id: 'representantes',
  path: ENDPOINTS.adolescenteRepresentante,
  title: 'Vínculos adolescente–representante',
  subtitle: 'Un representante puede vincularse a varios adolescentes sin duplicar sus datos.',
  singular: 'el vínculo',
  bajaLabel: 'Quitar vínculo',
  bajaAviso: 'El vínculo se desactiva y se conserva en el historial.',
  searchKeys: [],
  fields: [
    { key: 'adlc_id', label: 'Adolescente', type: 'ref', ref: 'adolescentes', required: true },
    { key: 'representante_id', label: 'Representante', type: 'ref', ref: 'representantes', required: true },
    { key: 'parentesco', label: 'Parentesco', type: 'select', options: PARENTESCOS, required: true },
    { key: 'principal', label: 'Representante principal', type: 'checkbox' },
  ],
  columns: [
    { key: 'adolescente', label: 'Adolescente', value: (r) => refTexto(r, 'adolescente') },
    { key: 'representante', label: 'Representante', value: (r) => refTexto(r, 'representante') },
    { key: 'parentesco', label: 'Parentesco', value: (r) => texto(r, 'parentesco') },
    { key: 'principal', label: 'Principal', value: (r) => siNo(r['principal']) },
    campoActivo,
  ],
}

// ── RF-08: contexto familiar ───────────────────────────────────
export const CONTEXTO_INTERVENCION: ModuloDef = {
  id: 'contexto-familiar',
  path: '/contexto-familiar/intervencion',
  title: 'Intervenciones familiares',
  subtitle: 'Registro de intervenciones con el representante del adolescente.',
  singular: 'la intervención',
  searchKeys: ['motivo', 'descripcion'],
  aviso: 'Información sensible del eje familiar: acceso solo para Trabajo Social, Psicología y Coordinación.',
  fields: [
    { key: 'adlc_id', label: 'Adolescente', type: 'ref', ref: 'adolescentes', required: true },
    { key: 'representante_id', label: 'Representante', type: 'ref', ref: 'representantes', required: true },
    { key: 'fecha', label: 'Fecha', type: 'date', required: true },
    { key: 'motivo', label: 'Motivo', required: true },
    { key: 'descripcion', label: 'Descripción', type: 'textarea', ancho: 'full' },
  ],
  columns: [
    { key: 'fecha', label: 'Fecha', value: (r) => fecha(r, 'fecha') },
    { key: 'adolescente', label: 'Adolescente', value: (r) => refTexto(r, 'adolescente') },
    { key: 'representante', label: 'Representante', value: (r) => refTexto(r, 'representante') },
    { key: 'motivo', label: 'Motivo', value: (r) => texto(r, 'motivo') },
  ],
}

export const CONTEXTO_FICHA: ModuloDef = {
  id: 'contexto-familiar',
  path: '/contexto-familiar/ficha',
  title: 'Fichas sociofamiliares',
  subtitle: 'Estructura por definir con la Directora de la UZDI; se amplía desde configuración.',
  singular: 'la ficha sociofamiliar',
  searchKeys: ['motivo', 'informacion'],
  aviso: 'Estructura por definir con la Directora de la UZDI. Información confidencial del eje familiar.',
  fields: [
    { key: 'adlc_id', label: 'Adolescente', type: 'ref', ref: 'adolescentes', required: true },
    { key: 'representante_id', label: 'Representante', type: 'ref', ref: 'representantes', required: true },
    { key: 'fecha', label: 'Fecha', type: 'date', required: true },
    { key: 'motivo', label: 'Motivo', required: true },
    { key: 'informacion', label: 'Información complementaria', type: 'textarea', ancho: 'full' },
  ],
  columns: [
    { key: 'fecha', label: 'Fecha', value: (r) => fecha(r, 'fecha') },
    { key: 'adolescente', label: 'Adolescente', value: (r) => refTexto(r, 'adolescente') },
    { key: 'representante', label: 'Representante', value: (r) => refTexto(r, 'representante') },
    { key: 'motivo', label: 'Motivo', value: (r) => texto(r, 'motivo') },
  ],
}

// ── RF-06: fichas psicológicas ─────────────────────────────────
export const FICHA_PSICOLOGICA: ModuloDef = {
  id: 'fichas',
  path: '/ficha-psicologica',
  title: 'Fichas psicológicas',
  subtitle: 'Evaluación, seguimiento e intervención en crisis.',
  singular: 'la ficha psicológica',
  searchKeys: ['motivo', 'observaciones', 'recomendaciones'],
  aviso: 'Información confidencial del eje psicológico: visible solo para Psicología y Coordinación.',
  fields: [
    { key: 'adlc_id', label: 'Adolescente', type: 'ref', ref: 'adolescentes', required: true },
    { key: 'tipo', label: 'Tipo de ficha', type: 'select', options: TIPOS_FICHA_PSICOLOGICA, required: true },
    { key: 'fecha', label: 'Fecha', type: 'date', required: true },
    { key: 'motivo', label: 'Motivo', required: true, ancho: 'full' },
    { key: 'observaciones', label: 'Observaciones', type: 'textarea', ancho: 'full' },
    { key: 'recomendaciones', label: 'Recomendaciones', type: 'textarea', ancho: 'full' },
  ],
  columns: [
    { key: 'fecha', label: 'Fecha', value: (r) => fecha(r, 'fecha') },
    { key: 'adolescente', label: 'Adolescente', value: (r) => refTexto(r, 'adolescente') },
    { key: 'tipo', label: 'Tipo', value: (r) => texto(r, 'tipo') },
    { key: 'motivo', label: 'Motivo', value: (r) => texto(r, 'motivo') },
  ],
}

// ── RF-14 / RF-15: talleres y asistencia ───────────────────────
export const TALLER: ModuloDef = {
  id: 'talleres',
  path: ENDPOINTS.taller,
  title: 'Talleres',
  subtitle: 'Planificación de talleres psicoeducativos y de habilidades sociales.',
  singular: 'el taller',
  bajaLabel: 'Desactivar taller',
  searchKeys: ['nombre', 'tema', 'objetivo', 'lugar', 'institucion'],
  fields: [
    { key: 'nombre', label: 'Nombre del taller', required: true },
    { key: 'tema', label: 'Tema', type: 'select', options: TEMAS_TALLER, required: true },
    { key: 'objetivo', label: 'Objetivo', type: 'textarea', ancho: 'full' },
    { key: 'fecha', label: 'Fecha', type: 'date', required: true },
    { key: 'hora_inicio', label: 'Hora de inicio', type: 'time', required: true },
    { key: 'hora_fin', label: 'Hora de fin', type: 'time', required: true,
      validate: (v, form) => String(v) > String(form.hora_inicio ?? '') ? '' : 'La hora de fin debe ser posterior a la de inicio.' },
    { key: 'lugar', label: 'Lugar', required: true },
    { key: 'institucion', label: 'Institución cooperante' },
  ],
  columns: [
    { key: 'fecha', label: 'Fecha', value: (r) => fecha(r, 'fecha') },
    { key: 'nombre', label: 'Taller', value: (r) => texto(r, 'nombre') },
    { key: 'tema', label: 'Tema', value: (r) => texto(r, 'tema') },
    { key: 'lugar', label: 'Lugar', value: (r) => texto(r, 'lugar') },
    { key: 'asistentes', label: 'Asistentes', value: (r) => `${texto(r, 'asistencias')} / ${texto(r, 'asistentes')}`, align: 'center' },
    campoActivo,
  ],
}

export const ASISTENCIA_TALLER: ModuloDef = {
  id: 'asistencia-talleres',
  path: ENDPOINTS.asistenciaTaller,
  title: 'Asistencia a talleres',
  subtitle: 'Registro de asistencia del adolescente y de su representante.',
  singular: 'la asistencia',
  searchKeys: [],
  fields: [
    { key: 'taller_id', label: 'Taller', type: 'ref', ref: 'talleres', required: true },
    { key: 'adlc_id', label: 'Adolescente', type: 'ref', ref: 'adolescentes', required: true },
    { key: 'asistencia_adolescente', label: 'Asistió el adolescente', type: 'checkbox' },
    { key: 'asistencia_representante', label: 'Asistió el representante', type: 'checkbox' },
  ],
  columns: [
    { key: 'taller', label: 'Taller', value: (r) => refTexto(r, 'taller') },
    { key: 'adolescente', label: 'Adolescente', value: (r) => refTexto(r, 'adolescente') },
    { key: 'asistencia_adolescente', label: 'Adolescente', value: (r) => siNo(r['asistencia_adolescente']) },
    { key: 'asistencia_representante', label: 'Representante', value: (r) => siNo(r['asistencia_representante']) },
  ],
}

// ── RF-24: información educativa ───────────────────────────────
export const EDUCACION: ModuloDef = {
  id: 'educacion',
  path: '/informacion-educativa',
  title: 'Información educativa',
  subtitle: 'Trayectoria educativa del adolescente.',
  singular: 'el registro educativo',
  bajaLabel: 'Marcar como retirado',
  bajaAviso: 'El registro se conserva para el historial; el adolescente deja de figurar como matriculado.',
  searchKeys: ['institucion', 'observaciones'],
  fields: [
    { key: 'adlc_id', label: 'Adolescente', type: 'ref', ref: 'adolescentes', required: true },
    { key: 'nivel', label: 'Nivel educativo', type: 'select', options: NIVELES_EDUCATIVOS, required: true },
    { key: 'institucion', label: 'Institución', required: true },
    { key: 'estado', label: 'Estado', type: 'select', options: ESTADOS_EDUCATIVOS, required: true },
    { key: 'observaciones', label: 'Observaciones', type: 'textarea', ancho: 'full' },
  ],
  columns: [
    { key: 'adolescente', label: 'Adolescente', value: (r) => refTexto(r, 'adolescente') },
    { key: 'nivel', label: 'Nivel', value: (r) => texto(r, 'nivel') },
    { key: 'institucion', label: 'Institución', value: (r) => texto(r, 'institucion') },
    { key: 'estado', label: 'Estado', value: (r) => texto(r, 'estado'),
      badge: badgeEstado(['Graduado', 'Matriculado'], ['Nivelación'], ['Retirado']) },
  ],
}

// ── RF-25: documentos habilitantes ─────────────────────────────
export const DOCUMENTO: ModuloDef = {
  id: 'documentos',
  path: ENDPOINTS.documentoExpediente,
  title: 'Documentos habilitantes',
  subtitle: 'Oficios, informes técnicos, resoluciones, actas y notificaciones.',
  singular: 'el documento',
  bajaLabel: 'Archivar documento',
  bajaAviso: 'El documento se archiva y se conserva; no se elimina del historial.',
  searchKeys: ['numero', 'emisor', 'contenido'],
  aviso: 'Información jurídica confidencial. En esta versión no se adjuntan archivos.',
  fields: [
    { key: 'tipo', label: 'Tipo', type: 'select', options: TIPOS_DOCUMENTO, required: true },
    { key: 'numero', label: 'Número', required: true },
    { key: 'adlc_id', label: 'Adolescente', type: 'ref', ref: 'adolescentes', required: true },
    { key: 'expediente_id', label: 'Expediente', type: 'ref', ref: 'expedientes' },
    { key: 'emisor', label: 'Emisor', required: true },
    { key: 'fecha_registro', label: 'Fecha de registro', type: 'date', required: true },
    { key: 'estado', label: 'Estado', type: 'select', options: ['Vigente', 'Archivado'], required: true },
    { key: 'contenido', label: 'Contenido', type: 'textarea', ancho: 'full' },
  ],
  columns: [
    { key: 'fecha_registro', label: 'Fecha', value: (r) => fecha(r, 'fecha_registro') },
    { key: 'tipo', label: 'Tipo', value: (r) => texto(r, 'tipo') },
    { key: 'numero', label: 'Número', value: (r) => texto(r, 'numero') },
    { key: 'adolescente', label: 'Adolescente', value: (r) => refTexto(r, 'adolescente') },
    { key: 'estado', label: 'Estado', value: (r) => texto(r, 'estado'),
      badge: badgeEstado(['Vigente'], [], ['Archivado']) },
  ],
}

// ── RF-26: alertas de salud ────────────────────────────────────
export const ALERTA_SALUD: ModuloDef = {
  id: 'alertas-salud',
  path: '/alerta-salud',
  title: 'Alertas de salud',
  subtitle: 'Seguimiento de alertas de salud. La descripción solo se muestra en el detalle.',
  singular: 'la alerta de salud',
  bajaLabel: 'Desactivar alerta',
  bajaAviso: 'La alerta se desactiva y se conserva en el historial.',
  searchKeys: [],
  aviso: 'Datos de salud de categoría especial (LOPDP): acceso solo para Trabajo Social y Coordinación.',
  fields: [
    { key: 'adlc_id', label: 'Adolescente', type: 'ref', ref: 'adolescentes', required: true },
    { key: 'tipo', label: 'Tipo de alerta', type: 'select', options: TIPOS_ALERTA_SALUD, required: true },
    { key: 'fecha', label: 'Fecha', type: 'date', required: true },
    { key: 'estado', label: 'Estado', type: 'select', options: ESTADOS_ALERTA_SALUD, required: true },
    { key: 'descripcion', label: 'Descripción', type: 'textarea', ancho: 'full' },
  ],
  columns: [
    { key: 'fecha', label: 'Fecha', value: (r) => fecha(r, 'fecha') },
    { key: 'adolescente', label: 'Adolescente', value: (r) => refTexto(r, 'adolescente') },
    { key: 'tipo', label: 'Tipo', value: (r) => texto(r, 'tipo') },
    { key: 'estado', label: 'Estado', value: (r) => texto(r, 'estado'),
      badge: badgeEstado(['Atendida'], ['En seguimiento'], ['Pendiente']) },
  ],
}

// ── RF-23: asignación de casos ─────────────────────────────────
export const ASIGNACION_CASO: ModuloDef = {
  id: 'asignacion-casos',
  path: '/asignacion-caso',
  title: 'Asignación de casos',
  subtitle: 'Técnico responsable por eje de atención. El motivo es obligatorio al reasignar.',
  singular: 'la asignación',
  bajaLabel: 'Desactivar asignación',
  searchKeys: ['motivo', 'eje'],
  fields: [
    { key: 'adlc_id', label: 'Adolescente', type: 'ref', ref: 'adolescentes', required: true },
    { key: 'expediente_id', label: 'Expediente', type: 'ref', ref: 'expedientes', required: true },
    { key: 'eje', label: 'Eje de atención', type: 'select', options: EJES_ATENCION, required: true },
    { key: 'usuario_id', label: 'Técnico responsable', type: 'ref', ref: 'usuarios', required: true },
    { key: 'fecha', label: 'Fecha', type: 'date', required: true },
    { key: 'motivo', label: 'Motivo', required: true, ancho: 'full' },
  ],
  columns: [
    { key: 'fecha', label: 'Fecha', value: (r) => fecha(r, 'fecha') },
    { key: 'adolescente', label: 'Adolescente', value: (r) => refTexto(r, 'adolescente') },
    { key: 'expediente', label: 'Expediente', value: (r) => refTexto(r, 'expediente') },
    { key: 'eje', label: 'Eje', value: (r) => texto(r, 'eje') },
    { key: 'usuario', label: 'Técnico', value: (r) => refTexto(r, 'usuario') },
  ],
}

// ── RF-05: catálogo y asignación de medidas ────────────────────
export const MEDIDA: ModuloDef = {
  id: 'medidas',
  path: ENDPOINTS.medidaSocioeducativa,
  title: 'Catálogo de medidas',
  subtitle: 'La duración es referencial; la fecha de fin se registra en cada asignación.',
  singular: 'la medida',
  bajaLabel: 'Desactivar medida',
  bajaAviso: 'La medida dejará de ofrecerse en nuevas asignaciones; las asignaciones existentes conservan su historial.',
  searchKeys: ['nombre', 'descripcion'],
  fields: [
    { key: 'nombre', label: 'Nombre de la medida', required: true, ancho: 'full' },
    { key: 'duracion_meses', label: 'Duración de referencia (meses)', type: 'number' },
    { key: 'descripcion', label: 'Descripción', type: 'textarea', ancho: 'full' },
  ],
  columns: [
    { key: 'nombre', label: 'Medida', value: (r) => texto(r, 'nombre') },
    { key: 'duracion_meses', label: 'Duración (meses)', value: (r) => texto(r, 'duracion_meses'), align: 'center' },
    { key: 'descripcion', label: 'Descripción', value: (r) => texto(r, 'descripcion') },
    campoActivo,
  ],
}

export const ASIGNACION_MEDIDA: ModuloDef = {
  id: 'medidas',
  path: ENDPOINTS.medidaExpediente,
  title: 'Asignaciones de medida',
  subtitle: 'La duración del catálogo es referencial; la fecha de fin se registra en cada asignación.',
  singular: 'la asignación de medida',
  searchKeys: ['detalle', 'estado'],
  fields: [
    { key: 'adlc_id', label: 'Adolescente', type: 'ref', ref: 'adolescentes', required: true },
    { key: 'expediente_id', label: 'Expediente', type: 'ref', ref: 'expedientes', required: true },
    { key: 'mdso_id', label: 'Medida', type: 'ref', ref: 'medidas', required: true },
    { key: 'fecha_inicio', label: 'Fecha de inicio', type: 'date', required: true },
    { key: 'fecha_fin', label: 'Fecha de fin estimada', type: 'date', required: true, validate: validarFin },
    { key: 'estado', label: 'Estado de cumplimiento', type: 'select', options: ['En curso', 'Cumplida', 'Incumplida'], required: true },
    { key: 'detalle', label: 'Detalle de cumplimiento', type: 'textarea', ancho: 'full' },
  ],
  columns: [
    { key: 'adolescente', label: 'Adolescente', value: (r) => refTexto(r, 'adolescente') },
    { key: 'medida', label: 'Medida', value: (r) => refTexto(r, 'medida') },
    { key: 'fecha_inicio', label: 'Inicio', value: (r) => fecha(r, 'fecha_inicio') },
    { key: 'fecha_fin', label: 'Fin', value: (r) => fecha(r, 'fecha_fin') },
    { key: 'estado', label: 'Estado', value: (r) => texto(r, 'estado'),
      badge: badgeEstado(['Cumplida'], ['En curso'], ['Incumplida']) },
  ],
}

// ── RF-11: UZDI ────────────────────────────────────────────────
export const UZDI: ModuloDef = {
  id: 'uzdi',
  path: ENDPOINTS.uzdi,
  title: 'Unidades de atención',
  subtitle: 'UZDIs del sistema. El Superadministrador gestiona todas; los demás ven la suya.',
  singular: 'la UZDI',
  bajaLabel: 'Desactivar UZDI',
  bajaAviso: 'La UZDI dejará de ofrecerse para nuevos registros; su historial se conserva.',
  searchKeys: ['nombre', 'zona', 'direccion', 'telefono', 'correo'],
  fields: [
    { key: 'nombre', label: 'Nombre', required: true },
    { key: 'zona', label: 'Zona', required: true },
    { key: 'provincia_id', label: 'Provincia', type: 'ref', ref: 'provincias' },
    { key: 'cntn_id', label: 'Cantón', type: 'ref', ref: 'cantones' },
    { key: 'direccion', label: 'Dirección', ancho: 'full' },
    { key: 'telefono', label: 'Teléfono', type: 'tel', validate: validarTelefono },
    { key: 'correo', label: 'Correo institucional', type: 'email' },
  ],
  columns: [
    { key: 'nombre', label: 'UZDI', value: (r) => texto(r, 'nombre') },
    { key: 'zona', label: 'Zona', value: (r) => texto(r, 'zona') },
    { key: 'canton', label: 'Cantón', value: (r) => refTexto(r, 'canton') },
    { key: 'telefono', label: 'Teléfono', value: (r) => texto(r, 'telefono') },
    campoActivo,
  ],
}

// ── RF-12: perfiles ────────────────────────────────────────────
export const PERFIL: ModuloDef = {
  id: 'perfiles',
  path: ENDPOINTS.perfil,
  title: 'Perfiles de acceso',
  subtitle: 'Perfiles del sistema. Los perfiles base no se pueden desactivar.',
  singular: 'el perfil',
  bajaLabel: 'Desactivar perfil',
  bajaAviso: 'El perfil dejará de asignarse a nuevos usuarios; los usuarios actuales conservan su acceso.',
  searchKeys: ['nombre', 'descripcion'],
  fields: [
    { key: 'nombre', label: 'Nombre del perfil', required: true },
    { key: 'descripcion', label: 'Descripción', type: 'textarea', ancho: 'full' },
  ],
  columns: [
    { key: 'nombre', label: 'Perfil', value: (r) => texto(r, 'nombre') },
    { key: 'descripcion', label: 'Descripción', value: (r) => texto(r, 'descripcion') },
    { key: 'sistema', label: 'Tipo', value: (r) => (r.sistema ? 'Base del sistema' : 'Personalizado') },
    campoActivo,
  ],
}

// ── RF-09/17–20: catálogos de apoyo ────────────────────────────
function catalogo(id: ModuleId, path: string, title: string, singular: string, camposExtra: CampoDef[] = [], columnasExtra: ColumnaDef[] = []): ModuloDef {
  return {
    id,
    path,
    title,
    subtitle: 'Catálogo de apoyo. Solo los valores activos se ofrecen en formularios.',
    singular,
    bajaLabel: 'Desactivar valor',
    bajaAviso: 'El valor dejará de ofrecerse en nuevos registros; los registros existentes conservan la referencia.',
    searchKeys: ['nombre'],
    fields: [{ key: 'nombre', label: 'Nombre', required: true }, ...camposExtra],
    columns: [{ key: 'nombre', label: 'Nombre', value: (r) => texto(r, 'nombre') }, ...columnasExtra, campoActivo],
  }
}

export const PROVINCIA = catalogo('catalogos', ENDPOINTS.provincia, 'Provincias', 'la provincia')
export const CANTON = catalogo('catalogos', ENDPOINTS.canton, 'Cantones', 'el cantón',
  [{ key: 'provincia_id', label: 'Provincia', type: 'ref', ref: 'provincias', required: true }],
  [{ key: 'provincia', label: 'Provincia', value: (r) => refTexto(r, 'provincia') }])
export const NACIONALIDAD = catalogo('catalogos', ENDPOINTS.nacionalidad, 'Nacionalidades', 'la nacionalidad')
export const ESTADO_CIVIL = catalogo('catalogos', ENDPOINTS.estadoCivil, 'Estados civiles', 'el estado civil')
export const ETNIA = catalogo('catalogos', ENDPOINTS.etnia, 'Etnias', 'la etnia')

/** Módulos que usan la vista genérica ModuleView. */
export const MODULES: Partial<Record<ModuleId, ModuloDef>> = {
  gdos: GDO,
  fichas: FICHA_PSICOLOGICA,
  educacion: EDUCACION,
  talleres: TALLER,
  documentos: DOCUMENTO,
  'alertas-salud': ALERTA_SALUD,
  'asistencia-talleres': ASISTENCIA_TALLER,
  'asignacion-casos': ASIGNACION_CASO,
  uzdi: UZDI,
  perfiles: PERFIL,
}

/** Campos obligatorios vacíos se validan también en el cliente (RNF-10). */
export function validarCampo(campo: CampoDef, valor: unknown, form: Record<string, unknown>): string {
  if (campo.required && !requerido(valor)) return 'Este campo es obligatorio.'
  if (campo.validate) return campo.validate(valor, form)
  return ''
}
