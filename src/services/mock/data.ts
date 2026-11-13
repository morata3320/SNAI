// Datos ficticios del modo demo (VITE_USE_MOCK=true). No representan personas reales.
// Las formas coinciden con los DTO de src/services/*.service.ts.
type Row = Record<string, any>

export const DEMO_PASSWORD = 'Snai2026'

// Genera una cédula ficticia estructuralmente válida (módulo 10) para los datos demo.
function cedulaDemo(base: number): string {
  const primeros = String(base).padStart(9, '0').slice(0, 9)
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2]
  let suma = 0
  for (let i = 0; i < 9; i++) {
    let producto = Number(primeros[i]) * coeficientes[i]
    if (producto > 9) producto -= 9
    suma += producto
  }
  return `${primeros}${(10 - (suma % 10)) % 10}`
}

export const nacionalidades: Row[] = ['Ecuatoriana', 'Colombiana', 'Venezolana', 'Peruana', 'Cubana', 'Otra']
  .map((nombre, i) => ({ id: i + 1, nombre }))
export const estadosCiviles: Row[] = ['Soltero/a', 'Casado/a', 'Unión de hecho', 'Divorciado/a', 'Viudo/a']
  .map((nombre, i) => ({ id: i + 1, nombre }))
export const etnias: Row[] = ['Mestizo/a', 'Indígena', 'Afroecuatoriano/a', 'Montubio/a', 'Blanco/a', 'Otra']
  .map((nombre, i) => ({ id: i + 1, nombre }))
export const gdos: Row[] = ['GDO Alfa', 'GDO Bravo', 'GDO Delta', 'GDO Sigma', 'GDO Omega']
  .map((nombre, i) => ({ id: i + 1, nombre }))
export const cantones: Row[] = [
  'Quito', 'Rumiñahui', 'Mejía', 'Cayambe', 'Guayaquil', 'Durán', 'Daule', 'Samborondón',
  'Cuenca', 'Gualaceo', 'Paute', 'Portoviejo', 'Manta', 'Ambato', 'Baños',
].map((nombre, i) => ({ id: i + 1, nombre }))

export const uzdis: Row[] = [
  { id: 1, nombre: 'UZDI Quito', zona: 'Zona 9', direccion: 'Av. Amazonas N24-15 y Colón', telefono: '022555101', correo: 'quito@uzdi.demo.ec', cntn_id: 1 },
  { id: 2, nombre: 'UZDI Guayaquil', zona: 'Zona 8', direccion: 'Av. 9 de Octubre 1204 y Boyacá', telefono: '042555202', correo: 'guayaquil@uzdi.demo.ec', cntn_id: 5 },
  { id: 3, nombre: 'UZDI Cuenca', zona: 'Zona 6', direccion: 'Calle Larga 7-35 y Hermano Miguel', telefono: '072555303', correo: 'cuenca@uzdi.demo.ec', cntn_id: 9 },
]

export const infracciones: Row[] = [
  { id: 1, nombre: 'Robo agravado', categoria: 'Contra la propiedad' },
  { id: 2, nombre: 'Hurto', categoria: 'Contra la propiedad' },
  { id: 3, nombre: 'Daño a bien ajeno', categoria: 'Contra la propiedad' },
  { id: 4, nombre: 'Tenencia ilegal de armas', categoria: 'Seguridad pública' },
  { id: 5, nombre: 'Tráfico ilícito de sustancias', categoria: 'Drogas' },
  { id: 6, nombre: 'Lesiones', categoria: 'Contra la integridad' },
  { id: 7, nombre: 'Extorsión', categoria: 'Contra la propiedad' },
]

export const medidas: Row[] = [
  ['Amonestación', 1], ['Imposición de reglas de conducta', 12], ['Orientación y apoyo psico-socio-familiar', 12],
  ['Servicio a la comunidad', 6], ['Libertad asistida', 12], ['Internamiento domiciliario', 12],
  ['Internamiento de fin de semana', 12], ['Internamiento con régimen semiabierto', 36], ['Internamiento institucional', 96],
].map(([nombre, duracion_meses], i) => ({ id: i + 1, nombre, duracion_meses }))

// nombre, apellido, nacimiento, sexo, nacionalidad, etnia, estado civil, cantón, uzdi, gdo
const ADOLESCENTES: [string, string, string, string, number, number, number, number, number, number | null][] = [
  ['Mateo', 'Andrade Pozo', '2010-03-14', 'Masculino', 1, 1, 1, 1, 1, 1],
  ['Sebastián', 'Cevallos Mora', '2009-11-02', 'Masculino', 1, 1, 1, 1, 1, null],
  ['Camila', 'Torres Vega', '2010-07-21', 'Femenino', 1, 2, 1, 2, 1, null],
  ['Daniel', 'Rueda Salas', '2009-05-30', 'Masculino', 2, 1, 1, 1, 1, 2],
  ['Valentina', 'Quispe León', '2011-01-18', 'Femenino', 1, 2, 1, 4, 1, null],
  ['Joel', 'Macías Zambrano', '2010-09-09', 'Masculino', 1, 4, 1, 3, 1, null],
  ['Kevin', 'Ortiz Barre', '2009-12-12', 'Masculino', 1, 3, 1, 5, 2, 3],
  ['Andrea', 'Franco Peña', '2010-04-04', 'Femenino', 1, 1, 1, 6, 2, null],
  ['Bryan', 'Villón Cedeño', '2010-02-27', 'Masculino', 1, 1, 1, 5, 2, 3],
  ['Génesis', 'Mero Alcívar', '2011-06-15', 'Femenino', 3, 4, 1, 7, 2, null],
  ['Anthony', 'Lema Guamán', '2009-08-08', 'Masculino', 1, 2, 1, 9, 3, null],
  ['Doménica', 'Sarmiento Ávila', '2010-10-23', 'Femenino', 1, 1, 1, 9, 3, null],
  ['Ismael', 'Pacheco Jara', '2010-01-30', 'Masculino', 1, 1, 1, 10, 3, 5],
]

export const adolescentes: Row[] = ADOLESCENTES.map((a, i) => ({
  id: i + 1,
  cedula: cedulaDemo(175000000 + i + 1),
  nombre: a[0],
  apellido: a[1],
  fecha_nac: a[2],
  sexo: a[3],
  nacn_id: a[4],
  etna_id: a[5],
  etcv_id: a[6],
  cntn_id: a[7],
  uzdi_id: a[8],
  gdo_id: a[9],
  hijos: 0,
  reincide: i === 3 || i === 8,
  hijoPpl: false,
  nved_nombre: null,
  fecha_ingr: '2026-0' + (1 + (i % 6)) + '-1' + (i % 9),
  observaciones: '',
}))

function addMonths(iso: string, m: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setMonth(d.getMonth() + m)
  return d.toISOString().slice(0, 10)
}

// adolescente, infracción, medida, meses, inicio, fin (opcional), estado especial (si no, se calcula)
const EXPEDIENTES: [number, number, number, number, string, string | null, string | null][] = [
  [1, 1, 5, 12, '2026-01-12', null, null],
  [2, 4, 2, 6, '2026-02-03', null, null],
  [3, 2, 4, 4, '2026-02-20', null, null],
  [4, 5, 9, 24, '2026-03-15', null, 'Incomparecencia'],
  [5, 6, 3, 6, '2026-04-02', null, null],
  [6, 3, 1, 1, '2026-01-05', null, null],
  [7, 1, 8, 24, '2026-03-01', null, null],
  [8, 2, 4, 3, '2026-05-10', null, null],
  [9, 7, 5, 12, '2026-06-01', null, null],
  [11, 6, 2, 6, '2026-04-22', null, null],
  [13, 1, 7, 6, '2026-07-14', null, null],
]
const HOY = new Date().toISOString().slice(0, 10)

export const expedientes: Row[] = EXPEDIENTES.map((e, i) => {
  const fin = e[5] ?? addMonths(e[4], e[3])
  const estado = e[6] ?? (fin < HOY ? 'Atraso' : 'En proceso')
  return {
    id: i + 1,
    adlc_id: e[0],
    uzdi_id: adolescentes[e[0] - 1].uzdi_id,
    infc_id: e[1],
    mdso_id: e[2],
    estado,
    fecha_inicio_medida: e[4],
    fecha_fin_medida: fin,
  }
})

// login, nombres, apellidos, tppr_id, uzdi_id
const USUARIOS: [string, string, string, number, number][] = [
  ['superadmin', 'Sofía', 'Valarezo', 4, 1],
  ['admin', 'Andrés', 'Naranjo', 3, 1],
  ['coordinador', 'Paola', 'Cisneros', 2, 1],
  ['tsocial', 'Marta', 'Guerra', 1, 1],
  ['psicologo', 'Esteban', 'Lasso', 6, 1],
  ['educador', 'Raúl', 'Montalvo', 7, 1],
  ['juridico', 'Carolina', 'Ibarra', 8, 1],
  ['tsocial.gye', 'Diego', 'Salcedo', 1, 2],
]

export const ROLES: Row[] = [
  { id: 1, nombre: 'Trabajador Social' }, { id: 2, nombre: 'Coordinador de área' }, { id: 3, nombre: 'Administrador' },
  { id: 4, nombre: 'Superadministrador' }, { id: 5, nombre: 'Usuario' }, { id: 6, nombre: 'Psicólogo' },
  { id: 7, nombre: 'Educador' }, { id: 8, nombre: 'Jurídico' },
]

export const usuarios: Row[] = USUARIOS.map((u, i) => ({
  id: i + 1,
  login: u[0],
  nombres: u[1],
  apellidos: u[2],
  correo: u[0].replace('.', '_') + '@uzdi.demo.ec',
  telefono: '09' + String(81000000 + (i + 1) * 4219).slice(0, 8),
  cedula: cedulaDemo(171000000 + i + 1),
  cargo: u[3] === 4 ? 'Director/a de UZDI' : u[3] === 3 ? 'Analista administrativo' : 'Técnico/a de atención',
  tppr_id: u[3],
  uzdi_id: u[4],
  roles: [ROLES[u[3] - 1]],
  activo: true,
  debe_cambiar_clave: false,
  creado_en: '2026-01-05T09:00:00.000Z',
  password: DEMO_PASSWORD,
}))

// ── Catálogos ampliados (RF-09, 17–20) ─────────────────────────
export const provincias: Row[] = [
  'Azuay', 'Bolívar', 'Cañar', 'Carchi', 'Chimborazo', 'Cotopaxi', 'El Oro', 'Esmeraldas',
  'Galápagos', 'Guayas', 'Imbabura', 'Loja', 'Los Ríos', 'Manabí', 'Morona Santiago', 'Napo',
  'Orellana', 'Pastaza', 'Pichincha', 'Santa Elena', 'Santo Domingo de los Tsáchilas',
  'Sucumbíos', 'Tungurahua', 'Zamora Chinchipe',
].map((nombre, i) => ({ id: i + 1, nombre, activo: true }))

// Cantón → provincia (provincia_id). Mantiene el orden de `cantones` (ids 1–15).
const PROVINCIA_DE_CANTON = [19, 19, 19, 19, 10, 10, 10, 10, 1, 1, 1, 14, 14, 23, 23]
cantones.forEach((c, i) => { c.provincia_id = PROVINCIA_DE_CANTON[i] })

gdos.forEach((g, i) => {
  g.descripcion = `Grupo de desarrollo organizacional de demostración ${i + 1}`
})
medidas.forEach((m) => {
  m.descripcion = 'Duración referencial; la fecha de fin se registra en cada asignación.'
})
uzdis.forEach((u) => {
  u.activo = true
  u.provincia_id = PROVINCIA_DE_CANTON[(u.cntn_id as number) - 1]
})
adolescentes.forEach((a) => {
  a.activo = true
  a.creado_por = 1
  a.creado_en = '2026-01-10T08:30:00.000Z'
  a.modificado_por = 1
  a.modificado_en = '2026-01-10T08:30:00.000Z'
})
expedientes.forEach((e, i) => {
  e.num_causa = `CAUSA-2026-${String(120 + i).padStart(4, '0')}`
  e.juzgado = ['Unidad Judicial Norte', 'Unidad Judicial Sur', 'Unidad Judicial de Guayaquil', 'Unidad Judicial de Cuenca'][i % 4]
  e.defensor = ['Ab. Lucía Paredes', 'Ab. Marco Villacís', 'Ab. Ana Cedillo', 'Ab. Jorge Bravo'][i % 4]
  e.fecha_apertura = e.fecha_inicio_medida
  e.fecha_cierre = null
  e.observaciones = ''
  e.activo = true
  e.creado_por = 1
  e.creado_en = '2026-02-01T09:00:00.000Z'
})
ROLES.forEach((r) => {
  r.descripcion = r.id === 5 ? 'Rol heredado sin módulos asignados.' : 'Perfil de acceso del sistema.'
  r.sistema = r.id !== 5
  r.activo = r.id !== 5
})

export const perfiles: Row[] = ROLES.map((r) => ({
  id: r.id, nombre: r.nombre, descripcion: r.descripcion,
  sistema: r.sistema, activo: r.activo,
}))

// ── Utilidades de fechas para las semillas ─────────────────────
const hoy = new Date()
const hoyISO = hoy.toISOString().slice(0, 10)
function addDays(dias: number): string {
  const d = new Date(hoy)
  d.setDate(d.getDate() + dias)
  return d.toISOString().slice(0, 10)
}

// ── RF-07 / RF-13: representantes y vínculos ──────────────────
const REPRESENTANTES: [string, string, string, string, number][] = [
  ['Rosa', 'Pozo Cabrera', 'Madre', '0991234501', 1],
  ['Luis', 'Andrade Salinas', 'Padre', '0991234502', 1],
  ['Mónica', 'Mora Cedeño', 'Madre', '0991234503', 1],
  ['Jorge', 'Torres Vera', 'Padre', '0991234504', 2],
  ['Ana', 'Vega Paredes', 'Madre', '0991234505', 2],
  ['Carlos', 'Rueda Molina', 'Tío/a', '0991234506', 1],
  ['Patricia', 'León Espinosa', 'Madre', '0991234507', 1],
  ['Sandra', 'Zambrano Ruiz', 'Madre', '0991234508', 2],
  ['Miguel', 'Ortiz Delgado', 'Padre', '0991234509', 2],
  ['Elena', 'Sarmiento Ávila', 'Abuelo/a', '0991234510', 3],
  ['Gladys', 'Guamán Pilco', 'Madre', '0991234511', 3],
  ['Víctor', 'Pacheco Jara', 'Tutor/a legal', '0991234512', 3],
]
export const representantes: Row[] = REPRESENTANTES.map((r, i) => ({
  id: i + 1,
  nombres: r[0],
  apellidos: r[1],
  parentesco: r[2],
  telefono: r[3],
  direccion: `Calle ${['Los Álamos', 'Las Casas', 'La Prensa', 'El Inca'][i % 4]} N${20 + i}-${10 + i}`,
  uzdi_id: r[4],
  activo: true,
  creado_por: 1,
  creado_en: '2026-01-12T10:00:00.000Z',
}))

// adolescente, representante, parentesco, principal
const VINCULOS: [number, number, string, boolean][] = [
  [1, 1, 'Madre', true], [1, 2, 'Padre', false],
  [2, 3, 'Madre', true],
  [3, 4, 'Padre', true], [3, 5, 'Madre', false],
  [4, 6, 'Tío/a', true],
  [5, 7, 'Madre', true],
  [6, 1, 'Tutor/a legal', true],
  [7, 8, 'Madre', true], [7, 9, 'Padre', false],
  [8, 8, 'Madre', true],
  [9, 9, 'Padre', true],
  [10, 8, 'Tutor/a legal', true],
  [11, 10, 'Abuelo/a', true],
  [12, 11, 'Madre', true],
  [13, 12, 'Tutor/a legal', true],
]
export const vinculosRepresentante: Row[] = VINCULOS.map((v, i) => ({
  id: i + 1,
  adlc_id: v[0],
  representante_id: v[1],
  parentesco: v[2],
  principal: v[3],
  uzdi_id: adolescentes[v[0] - 1].uzdi_id,
  activo: true,
}))

// ── RF-08: contexto familiar ───────────────────────────────────
export const contextoIntervenciones: Row[] = VINCULOS.slice(0, 10).map((v, i) => ({
  id: i + 1,
  representante_id: v[1],
  adlc_id: v[0],
  fecha: addDays(-60 + i * 4),
  motivo: ['Apoyo en pautas de crianza', 'Orientación familiar', 'Seguimiento de medida', 'Contención emocional'][i % 4],
  descripcion: 'Intervención ficticia de demostración. Información sujeta a confidencialidad.',
  uzdi_id: adolescentes[v[0] - 1].uzdi_id,
  activo: true,
  creado_por: 1,
  creado_en: '2026-03-01T09:00:00.000Z',
}))

export const contextoFichas: Row[] = VINCULOS.slice(0, 8).map((v, i) => ({
  id: i + 1,
  representante_id: v[1],
  adlc_id: v[0],
  fecha: addDays(-45 + i * 5),
  motivo: 'Ficha sociofamiliar de demostración',
  // Estructura por definir con el SNAI: campo libre ampliable.
  informacion: 'Vivienda, composición familiar y redes de apoyo. Estructura por definir con la Directora de la UZDI.',
  uzdi_id: adolescentes[v[0] - 1].uzdi_id,
  activo: true,
}))

// ── RF-06: fichas psicológicas (solo Psicólogo + Coordinador) ──
const TIPOS_FICHA = ['Evaluación inicial', 'Seguimiento psicológico', 'Intervención en crisis']
export const fichasPsicologicas: Row[] = [1, 2, 3, 5, 7, 8, 10, 11, 12, 13].map((adlc, i) => ({
  id: i + 1,
  adlc_id: adlc,
  tipo: TIPOS_FICHA[i % TIPOS_FICHA.length],
  fecha: addDays(-70 + i * 6),
  motivo: 'Evaluación y acompañamiento psicológico de demostración.',
  observaciones: 'Información confidencial. Acceso restringido a Psicología y Coordinación.',
  recomendaciones: 'Continuar seguimiento semanal y coordinar con el eje social.',
  uzdi_id: adolescentes[adlc - 1].uzdi_id,
  activo: true,
  creado_por: 5,
  creado_en: '2026-03-10T11:00:00.000Z',
}))

// ── RF-14 / RF-15: talleres y asistencia ───────────────────────
const TALLERES: [string, string, string, number, string, number][] = [
  ['Taller de autoestima', 'Autoestima', 'Fortalecer la autopercepción y el autocuidado', 5, '09:00', 1],
  ['Habilidades para la vida', 'Habilidades sociales', 'Practicar comunicación asertiva', 12, '10:00', 1],
  ['Proyecto de vida', 'Proyecto de vida', 'Definir metas personales y educativas', 19, '14:00', 2],
  ['Manejo de emociones', 'Manejo de emociones', 'Reconocer y regular emociones', 26, '09:30', 2],
  ['Prevención de consumo', 'Prevención de consumo', 'Identificar factores de riesgo', 33, '11:00', 3],
  ['Convivencia familiar', 'Convivencia familiar', 'Fortalecer pautas de convivencia', 40, '15:00', 1],
  ['Autoestima y redes', 'Autoestima', 'Construir redes de apoyo positivas', 47, '09:00', 2],
  ['Ruta educativa', 'Proyecto de vida', 'Retomar el proceso educativo', 54, '10:30', 3],
]
export const talleres: Row[] = TALLERES.map((t, i) => ({
  id: i + 1,
  nombre: t[0],
  tema: t[1],
  objetivo: t[2],
  fecha: addDays(t[3]),
  hora_inicio: t[4],
  hora_fin: t[4] === '14:00' ? '16:00' : '11:30',
  lugar: ['Sala de usos múltiples', 'Patio central', 'Aula 2'][i % 3],
  institucion: ['Fundación Horizonte', 'Ministerio de Educación', 'GAD Municipal'][i % 3],
  uzdi_id: t[5],
  activo: true,
  creado_por: 6,
  creado_en: '2026-04-01T10:00:00.000Z',
}))

export const asistenciasTaller: Row[] = []
let asistenciaId = 0
for (const taller of talleres) {
  const candidatos = adolescentes.filter((a) => a.uzdi_id === taller.uzdi_id).slice(0, 4)
  for (const a of candidatos) {
    asistenciasTaller.push({
      id: ++asistenciaId,
      taller_id: taller.id,
      adlc_id: a.id,
      asistencia_adolescente: (a.id + taller.id) % 3 !== 0,
      asistencia_representante: (a.id + taller.id) % 4 === 0,
      uzdi_id: taller.uzdi_id,
      activo: true,
    })
  }
}

// ── RF-24: información educativa ───────────────────────────────
const NIVELES = ['Educación general básica', 'Bachillerato', 'Bachillerato técnico', 'Nivelación']
const ESTADOS_EDU = ['Matriculado', 'Nivelación', 'Graduado', 'Retirado']
export const informacionEducativa: Row[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((adlc, i) => ({
  id: i + 1,
  adlc_id: adlc,
  nivel: NIVELES[i % NIVELES.length],
  institucion: `Unidad Educativa ${['Central', 'Del Sur', 'San José', 'Nuevo Ecuador'][i % 4]}`,
  estado: ESTADOS_EDU[i % ESTADOS_EDU.length],
  observaciones: '',
  uzdi_id: adolescentes[adlc - 1].uzdi_id,
  activo: true,
}))

// ── RF-25: documentos (solo Jurídico) ──────────────────────────
const TIPOS_DOC = ['Oficio', 'Informe técnico', 'Resolución', 'Acta', 'Notificación']
export const documentos: Row[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((expId, i) => {
  const e = expedientes[expId - 1]
  return {
    id: i + 1,
    tipo: TIPOS_DOC[i % TIPOS_DOC.length],
    numero: `DOC-2026-${String(300 + i).padStart(4, '0')}`,
    adlc_id: e.adlc_id,
    expediente_id: e.id,
    emisor: 'Unidad Judicial de demostración',
    fecha_registro: addDays(-30 + i * 3),
    estado: i % 4 === 0 ? 'Archivado' : 'Vigente',
    contenido: 'Documento de demostración sin adjuntos en esta iteración.',
    uzdi_id: e.uzdi_id,
    activo: true,
  }
})

// ── RF-26: alertas de salud (categoría especial) ───────────────
const TIPOS_ALERTA = ['Salud mental', 'Medicación', 'Enfermedad crónica', 'Control médico', 'Consumo problemático']
const ESTADOS_ALERTA = ['Pendiente', 'En seguimiento', 'Atendida']
export const alertasSalud: Row[] = [1, 2, 3, 4, 6, 7, 8, 9, 10, 12].map((adlc, i) => ({
  id: i + 1,
  adlc_id: adlc,
  tipo: TIPOS_ALERTA[i % TIPOS_ALERTA.length],
  fecha: addDays(-25 + i * 4),
  estado: ESTADOS_ALERTA[i % ESTADOS_ALERTA.length],
  // La descripción solo se muestra en el detalle, nunca en el listado.
  descripcion: 'Alerta de salud ficticia. Información sensible de categoría especial.',
  uzdi_id: adolescentes[adlc - 1].uzdi_id,
  activo: true,
  creado_por: 4,
  creado_en: '2026-05-02T08:00:00.000Z',
}))

// ── RF-23: asignación de casos por eje ─────────────────────────
const EJES = ['Social', 'Psicológico', 'Educativo', 'Jurídico']
const TECNICO_POR_EJE: Record<string, number> = { Social: 4, Psicológico: 5, Educativo: 6, Jurídico: 7 }
export const asignacionesCaso: Row[] = expedientes.flatMap((e, i) => {
  const eje = EJES[i % EJES.length]
  return [{
    id: i + 1,
    adlc_id: e.adlc_id,
    expediente_id: e.id,
    eje,
    usuario_id: TECNICO_POR_EJE[eje],
    motivo: 'Asignación inicial de demostración',
    fecha: addDays(-40 + i * 3),
    uzdi_id: e.uzdi_id,
    activo: true,
  }]
})

// ── RF-05: asignaciones de medida ──────────────────────────────
export const asignacionesMedida: Row[] = expedientes.map((e, i) => {
  const medida = medidas.find((m) => m.id === e.mdso_id)
  return {
    id: i + 1,
    adlc_id: e.adlc_id,
    expediente_id: e.id,
    mdso_id: e.mdso_id,
    fecha_inicio: e.fecha_inicio_medida,
    fecha_fin: e.fecha_fin_medida,
    detalle: 'Cumplimiento de demostración',
    estado: e.estado === 'Cerrado' ? 'Cumplida' : 'En curso',
    duracion_referencia: medida?.duracion_meses ?? null,
    uzdi_id: e.uzdi_id,
    activo: true,
  }
})

// ── RF-27: informes técnicos generados ────────────────────────
export const informesTecnicos: Row[] = [1, 2, 4, 6, 9, 11].map((adlc, i) => ({
  id: i + 1,
  adlc_id: adlc,
  tipo: 'Informe técnico integral',
  periodo_desde: addDays(-120),
  periodo_hasta: addDays(-5),
  generado_por: 4,
  fecha: addDays(-3 + i),
  secciones: ['Datos de identificación', 'Motivo del informe', 'Conclusiones y recomendaciones'],
  uzdi_id: adolescentes[adlc - 1].uzdi_id,
  activo: true,
}))

// ── RF-22: bitácora (solo lectura, sin datos de adolescentes) ──
const EVENTOS_BITACORA: [number, string, string, string][] = [
  [1, 'inicio_sesion', 'sesion', 'Inicio de sesión del usuario #1'],
  [3, 'cambio_permisos', 'permisos', 'Actualización de la matriz del perfil #2'],
  [2, 'modificacion_usuario', 'usuario', 'Actualización del usuario #5'],
  [4, 'inicio_sesion', 'sesion', 'Inicio de sesión del usuario #4'],
  [1, 'descarga_reporte', 'reporte', 'Descarga de reporte agregado por medida'],
  [2, 'generacion_informe', 'informe', 'Generación de informe técnico #3'],
  [3, 'modificacion_usuario', 'usuario', 'Desactivación del usuario #9'],
  [1, 'inicio_sesion', 'sesion', 'Inicio de sesión del usuario #1'],
  [4, 'descarga_reporte', 'reporte', 'Descarga de reporte de vencimientos'],
  [2, 'cambio_permisos', 'permisos', 'Consulta de la matriz del perfil #1'],
  [1, 'generacion_informe', 'informe', 'Generación de informe técnico #6'],
  [3, 'inicio_sesion', 'sesion', 'Inicio de sesión del usuario #3'],
]
export const bitacora: Row[] = EVENTOS_BITACORA.map((ev, i) => ({
  id: i + 1,
  fecha: new Date(Date.now() - (i + 1) * 3600_000 * 5).toISOString(),
  usuario_id: ev[0],
  usuario: usuarios[ev[0] - 1]?.login ?? 'sistema',
  tipo: ev[1],
  entidad: ev[2],
  entidad_id: i + 1,
  detalle: ev[3],
}))

/** Permisos editados desde RF-10 (rol → matriz). Se reinician al recargar. */
export const permisosPorRol: Record<number, Row> = {}

/** Parámetros del sistema (RNF-03/04) expuestos por el mock. */
export const parametros: Row = {
  seguridad: {
    sesionTimeout: 30,
    intentosMaximos: 3,
    cambioPassDias: 90,
    duracionBloqueoMin: 5,
  },
  notificaciones: {
    diasAnticipacionVencimiento: 7,
    correoAlertas: 'alertas@uzdi.demo.ec',
    emailActivo: true,
  },
  organizacion: {
    nombre: 'Unidad Zonal de Desarrollo Integral',
    siglas: 'UZDI',
  },
}

export const HOY_DEMO = hoyISO
