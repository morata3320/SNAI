<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useCatalogos } from '../composables/useCatalogos'
import { useToast } from '../composables/useToast'
import { adolescenteService } from '../services/adolescente.service'
import { expedienteService } from '../services/expediente.service'
import { roleKey, type RoleKey } from '../router/access'
import api from '../services/api'
import { reportesService, type FormatoInstitucional } from '../services/reportes.service'
import { ENDPOINTS } from '../services/backend-contract'
import { mensajeErrorApi } from '../services/response'
import { listaDe } from '../services/response'

const { uzdis, cargarCatalogos } = useCatalogos()
const { user } = useAuth()
const toast = useToast()
const descargandoInstitucional = ref<FormatoInstitucional | null>(null)

type AdolRow = Awaited<ReturnType<typeof adolescenteService.getAll>>[number]
type ExpeRow = Awaited<ReturnType<typeof expedienteService.getAll>>[number]

interface RepresentanteRow {
  id: number
  parentesco?: string
  uzdi_id?: number
  creado_en?: string
  activo?: boolean
}
interface TallerRow {
  id: number
  nombre: string
  fecha: string
  uzdi_id?: number
  activo?: boolean
}
interface AsistenciaRow {
  taller_id: number
  adlc_id: number
  asistencia_adolescente: boolean
  asistencia_representante: boolean
  uzdi_id?: number
  activo?: boolean
}

const adolescentes = ref<AdolRow[]>([])
const expedientes  = ref<ExpeRow[]>([])
const representantes = ref<RepresentanteRow[]>([])
const talleres = ref<TallerRow[]>([])
const asistencias = ref<AsistenciaRow[]>([])
const loadingData  = ref(true)
const generated    = ref(false)
const errorCarga   = ref('')

const rol = computed(() => roleKey((user.value?.['tppr_id'] as number | undefined) ?? null))
const esSuperadmin = computed(() => rol.value === 'superadmin')
const uzdiUsuarioId = computed(() => (user.value?.['uzdi_id'] as number | undefined) ?? null)

const REPORTES_POR_ROL: Record<RoleKey, string[]> = {
  superadmin: [
    'Estadístico general', 'Adolescentes activos', 'Medidas socioeducativas',
    'Expedientes', 'Expedientes por UZDI', 'Revisiones y seguimiento',
  ],
  admin: [
    'Estadístico general', 'Adolescentes activos', 'Medidas socioeducativas',
    'Expedientes', 'Expedientes por UZDI', 'Revisiones y seguimiento',
  ],
  coordinador: [
    'Estadístico general', 'Adolescentes activos', 'Medidas socioeducativas',
    'Expedientes', 'Expedientes por UZDI', 'Revisiones y seguimiento',
    'Participación en talleres',
  ],
  tsocial: ['Estadístico general', 'Adolescentes activos', 'Familias y representantes', 'Expedientes'],
  psicologo: ['Participación en talleres'],
  educador: ['Participación en talleres', 'Adolescentes activos'],
  juridico: ['Expedientes', 'Expedientes por UZDI', 'Medidas socioeducativas', 'Revisiones y seguimiento'],
  usuario: [],
}

const tiposDisponibles = computed(() => REPORTES_POR_ROL[rol.value] ?? [])

const hoyISO = () => new Date().toISOString().slice(0, 10)
const inicioAnio = () => `${new Date().getFullYear()}-01-01`
const zonaUsuario = computed(() => uzdis.value.find(u => u.id === uzdiUsuarioId.value)?.nombre ?? '')

const defaultForm = {
  tipo: '',
  periodo: 'Anual',
  zona: '',
  fechaDesde: inicioAnio(),
  fechaHasta: hoyISO(),
  formato: 'PDF',
}
const form = reactive({ ...defaultForm })

const uzdiOptions = computed(() =>
  esSuperadmin.value
    ? uzdis.value.map(u => u.nombre)
    : uzdis.value.filter(u => u.id === uzdiUsuarioId.value).map(u => u.nombre)
)

const rangoInvalido = computed(() =>
  !!form.fechaDesde && !!form.fechaHasta && form.fechaHasta < form.fechaDesde
)

const formValido = computed(() =>
  !!form.tipo && !!form.zona && !!form.fechaDesde && !!form.fechaHasta && !rangoInvalido.value
)

async function cargarDatosOpcionales() {
  const tipos = tiposDisponibles.value
  if (tipos.includes('Familias y representantes')) {
    try {
      const { data } = await api.get<RepresentanteRow[]>(ENDPOINTS.representante)
      representantes.value = listaDe<RepresentanteRow>(data).filter(r => r.activo !== false)
    } catch {
      errorCarga.value = 'No se pudieron cargar los representantes para el reporte de familias.'
    }
  }
  if (tipos.includes('Participación en talleres')) {
    try {
      const [t, a] = await Promise.all([
        api.get<TallerRow[]>(ENDPOINTS.taller),
        api.get<AsistenciaRow[]>(ENDPOINTS.asistenciaTaller),
      ])
      talleres.value = listaDe<TallerRow>(t.data).filter(x => x.activo !== false)
      asistencias.value = listaDe<AsistenciaRow>(a.data).filter(x => x.activo !== false)
    } catch {
      errorCarga.value = 'No se pudieron cargar los talleres y asistencias para el reporte de participación.'
    }
  }
}

onMounted(async () => {
  await cargarCatalogos()
  form.tipo = tiposDisponibles.value[0] ?? ''
  form.zona = esSuperadmin.value ? 'Todas las zonas' : zonaUsuario.value
  try {
    const [resultadoAdolescentes, resultadoExpedientes] = await Promise.allSettled([
      adolescenteService.getAll(),
      expedienteService.getAll(),
    ])
    if (resultadoAdolescentes.status === 'fulfilled') adolescentes.value = resultadoAdolescentes.value
    if (resultadoExpedientes.status === 'fulfilled') expedientes.value = resultadoExpedientes.value
    if (resultadoAdolescentes.status === 'rejected' && resultadoExpedientes.status === 'rejected') {
      errorCarga.value = 'El backend no autorizó los datos base para la vista previa. Puede usar las descargas institucionales según su perfil.'
    }
    await cargarDatosOpcionales()
  } finally {
    loadingData.value = false
  }
})

function resetForm() {
  Object.assign(form, {
    ...defaultForm,
    tipo: tiposDisponibles.value[0] ?? '',
    zona: esSuperadmin.value ? 'Todas las zonas' : zonaUsuario.value,
    fechaDesde: inicioAnio(),
    fechaHasta: hoyISO(),
  })
  generated.value = false
  errorCarga.value = ''
}

function generar() {
  if (!formValido.value) {
    toast.error(rangoInvalido.value
      ? 'La fecha hasta no puede ser anterior a la fecha desde.'
      : 'Complete el tipo de reporte, la UZDI y el rango de fechas.')
    return
  }
  generated.value = true
}

const zonaId = computed(() =>
  form.zona && form.zona !== 'Todas las zonas'
    ? uzdis.value.find(u => u.nombre === form.zona)?.id ?? null
    : null
)

function coincideZona(uzdiId?: number | null): boolean {
  return !zonaId.value || uzdiId === zonaId.value
}

function enRango(iso?: string | null): boolean {
  if (!iso) return false
  const fecha = iso.substring(0, 10)
  return fecha >= form.fechaDesde && fecha <= form.fechaHasta
}

const adolescentesFiltrados = computed(() =>
  adolescentes.value.filter(a => coincideZona(a._raw.uzdi_id) && enRango(a._raw.fecha_ingr))
)
const expedientesFiltrados = computed(() =>
  expedientes.value.filter(e =>
    coincideZona(e._raw.uzdi_id) &&
    enRango(e._raw.fecha_apertura || e._raw.fecha_inicio_medida)
  )
)
const representantesFiltrados = computed(() =>
  representantes.value.filter(r => coincideZona(r.uzdi_id) && enRango(r.creado_en))
)
const talleresFiltrados = computed(() =>
  talleres.value.filter(t => coincideZona(t.uzdi_id) && enRango(t.fecha))
)

async function registrarDescarga(formato: 'CSV' | 'PDF') {
  // Ruta heredada del mock: el backend real registra la descarga internamente.
  if (import.meta.env.VITE_USE_MOCK !== 'true') return
  try {
    await api.post('/reporte/descarga', {
      tipo: form.tipo || 'Estadístico general',
      formato,
      desde: form.fechaDesde || undefined,
      hasta: form.fechaHasta || undefined,
    })
  } catch {
    toast.error('El reporte se generó, pero no se pudo registrar la descarga en la bitácora.')
  }
}

async function descargarPDF() {
  await registrarDescarga('PDF')
  window.print()
}

async function descargarInstitucional(formato: FormatoInstitucional) {
  if (descargandoInstitucional.value) return
  descargandoInstitucional.value = formato
  try {
    await reportesService.descargarInstitucional(formato, {
      ...(zonaId.value ? { uzdi_id: zonaId.value } : {}),
    })
    toast.success(`Descarga institucional ${formato.toUpperCase()} iniciada.`)
  } catch (error) {
    toast.error(mensajeErrorApi(error, error instanceof Error ? error.message : 'No se pudo descargar el archivo del backend.'))
  } finally {
    descargandoInstitucional.value = null
  }
}

async function exportarCSV() {
  const filas = reporteData.value.filas
  const escapar = (valor: string | number) => `"${String(valor).replace(/"/g, '""')}"`
  const contenido = [
    escapar('Indicador'), escapar('Valor'),
    ...filas.map(f => `${escapar(f.indicador)},${escapar(f.valor)}`),
  ].join('\r\n')
  const blob = new Blob(['\ufeff' + contenido], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  const tipo = (form.tipo || 'estadistico-general').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  enlace.href = url
  enlace.download = `reporte-${tipo}-${new Date().toISOString().slice(0, 10)}.csv`
  enlace.click()
  URL.revokeObjectURL(url)
  await registrarDescarga('CSV')
  toast.success('Reporte exportado en CSV compatible con Excel.')
}

function diasHasta(isoDate: string) {
  const diff = new Date(isoDate).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const reporteData = computed(() => {
  const adols = adolescentesFiltrados.value
  const expes = expedientesFiltrados.value
  const enProceso = expes.filter(e => e.estado === 'En proceso').length
  const conAlerta = expes.filter(e => e.estado === 'Atraso' || e.estado === 'Incomparecencia').length
  const atrasos   = expes.filter(e => e.estado === 'Atraso').length
  const incompar  = expes.filter(e => e.estado === 'Incomparecencia').length
  const conFin    = expes.filter(e => !!e._raw.fecha_fin_medida)
  const tipo = form.tipo || tiposDisponibles.value[0] || 'Estadístico general'

  if (tipo === 'Estadístico general') {
    return {
      stats: [
        { color: 'blue',  num: String(adols.length),  label: 'Adolescentes registrados' },
        { color: 'green', num: String(enProceso),     label: 'Expedientes en proceso'   },
        { color: 'amber', num: String(conAlerta),     label: 'Con alerta'               },
        { color: 'slate', num: String(expes.length),  label: 'Total expedientes'        },
      ],
      filas: [
        { indicador: 'Adolescentes registrados',      valor: adols.length         },
        { indicador: 'Total expedientes',             valor: expes.length         },
        { indicador: 'En proceso',                    valor: enProceso            },
        { indicador: 'Con alerta (Atraso / Incomparecencia)', valor: conAlerta   },
        { indicador: 'Con fecha de vencimiento',      valor: conFin.length        },
      ],
    }
  }

  if (tipo === 'Adolescentes activos') {
    const reincidentes = adols.filter(a => a._raw.reincide === true).length
    const edad14_15    = adols.filter(a => a.edad >= 14 && a.edad <= 15).length
    const edad16_17    = adols.filter(a => a.edad >= 16 && a.edad <= 17).length
    return {
      stats: [
        { color: 'blue',  num: String(adols.length),  label: 'Total registrados'  },
        { color: 'amber', num: String(reincidentes),  label: 'Reincidentes'       },
        { color: 'green', num: String(edad14_15),     label: 'Edades 14–15 años'  },
        { color: 'slate', num: String(edad16_17),     label: 'Edades 16–17 años'  },
      ],
      filas: [
        { indicador: 'Total adolescentes',   valor: adols.length                      },
        { indicador: 'Reincidentes',         valor: reincidentes                      },
        { indicador: 'Rango 14–15 años',     valor: edad14_15                         },
        { indicador: 'Rango 16–17 años',     valor: edad16_17                         },
        { indicador: 'Otras edades',         valor: adols.length - edad14_15 - edad16_17 },
      ],
    }
  }

  if (tipo === 'Medidas socioeducativas') {
    const counts: Record<string, number> = {}
    for (const e of expes) { const m = e.medida || 'Sin medida'; counts[m] = (counts[m] ?? 0) + 1 }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6)
    return {
      stats: [
        { color: 'green', num: String(expes.length), label: 'Total expedientes'  },
        { color: 'blue',  num: String(enProceso),    label: 'En proceso'         },
        { color: 'amber', num: String(atrasos),      label: 'En atraso'          },
        { color: 'red',   num: String(incompar),     label: 'Incomparecencia'    },
      ],
      filas: top.map(([indicador, valor]) => ({ indicador, valor })),
    }
  }

  if (tipo === 'Expedientes') {
    const vencen7  = conFin.filter(e => { const d = diasHasta(e._raw.fecha_fin_medida!); return d >= 0 && d <= 7 }).length
    const vencen30 = conFin.filter(e => { const d = diasHasta(e._raw.fecha_fin_medida!); return d >= 0 && d <= 30 }).length
    const vencidos = conFin.filter(e => diasHasta(e._raw.fecha_fin_medida!) < 0).length
    return {
      stats: [
        { color: 'green', num: String(expes.length), label: 'Total expedientes'   },
        { color: 'blue',  num: String(enProceso),    label: 'En proceso'          },
        { color: 'amber', num: String(vencen7),      label: 'Vencen en 7 días'    },
        { color: 'red',   num: String(vencidos),     label: 'Vencidos'            },
      ],
      filas: [
        { indicador: 'Total expedientes',           valor: expes.length  },
        { indicador: 'En proceso',                  valor: enProceso     },
        { indicador: 'Con alerta',                  valor: conAlerta     },
        { indicador: 'Vencen próximos 7 días',      valor: vencen7       },
        { indicador: 'Vencen próximos 30 días',     valor: vencen30      },
        { indicador: 'Ya vencidos',                 valor: vencidos      },
      ],
    }
  }

  if (tipo === 'Expedientes por UZDI') {
    const counts: Record<string, number> = {}
    for (const e of expes) counts[e.uzdi] = (counts[e.uzdi] ?? 0) + 1
    const filas = Object.entries(counts).sort((a, b) => b[1] - a[1])
      .map(([indicador, valor]) => ({ indicador, valor }))
    return {
      stats: [
        { color: 'blue',  num: String(filas.length), label: 'UZDI con expedientes' },
        { color: 'green', num: String(expes.length), label: 'Total expedientes'    },
        { color: 'amber', num: String(conAlerta),    label: 'Con alerta'           },
        { color: 'slate', num: String(enProceso),    label: 'En proceso'           },
      ],
      filas: filas.length ? filas : [{ indicador: 'Sin expedientes en el rango', valor: 0 }],
    }
  }

  if (tipo === 'Familias y representantes') {
    const reps = representantesFiltrados.value
    const counts: Record<string, number> = {}
    for (const r of reps) {
      const p = r.parentesco || 'Sin parentesco registrado'
      counts[p] = (counts[p] ?? 0) + 1
    }
    const filas = Object.entries(counts).sort((a, b) => b[1] - a[1])
      .map(([indicador, valor]) => ({ indicador, valor }))
    return {
      stats: [
        { color: 'blue',  num: String(reps.length), label: 'Representantes registrados' },
        { color: 'green', num: String(filas.length), label: 'Parentescos distintos'     },
        { color: 'amber', num: String(adols.length), label: 'Adolescentes en el rango'  },
        { color: 'slate', num: String(expes.length), label: 'Expedientes en el rango'   },
      ],
      filas: filas.length ? filas : [{ indicador: 'Sin representantes en el rango', valor: 0 }],
    }
  }

  if (tipo === 'Participación en talleres') {
    const tallerIds = new Set(talleresFiltrados.value.map(t => t.id))
    const asis = asistencias.value.filter(a => tallerIds.has(a.taller_id) && coincideZona(a.uzdi_id))
    const adolSi = asis.filter(a => a.asistencia_adolescente).length
    const repSi = asis.filter(a => a.asistencia_representante).length
    const filas = talleresFiltrados.value.map(t => {
      const propias = asis.filter(a => a.taller_id === t.id)
      return {
        indicador: `${t.nombre} (${t.fecha})`,
        valor: propias.filter(a => a.asistencia_adolescente).length,
      }
    })
    return {
      stats: [
        { color: 'blue',  num: String(talleresFiltrados.value.length), label: 'Talleres en el rango'     },
        { color: 'green', num: String(adolSi), label: 'Asistencias de adolescentes' },
        { color: 'amber', num: String(repSi),  label: 'Asistencias de representantes' },
        { color: 'slate', num: String(asis.length), label: 'Registros de asistencia' },
      ],
      filas: filas.length ? filas : [{ indicador: 'Sin talleres en el rango', valor: 0 }],
    }
  }

  const vencen7  = conFin.filter(e => { const d = diasHasta(e._raw.fecha_fin_medida!); return d >= 0 && d <= 7 }).length
  const vencen30 = conFin.filter(e => { const d = diasHasta(e._raw.fecha_fin_medida!); return d >= 0 && d <= 30 }).length
  const vencidos = conFin.filter(e => diasHasta(e._raw.fecha_fin_medida!) < 0).length
  return {
    stats: [
      { color: 'amber', num: String(vencen7),       label: 'Vencen en 7 días'      },
      { color: 'red',   num: String(vencidos),      label: 'Ya vencidos'            },
      { color: 'green', num: String(enProceso),     label: 'En proceso activo'      },
      { color: 'blue',  num: String(conFin.length), label: 'Con fecha de venc.'     },
    ],
    filas: [
      { indicador: 'Con fecha de vencimiento',             valor: conFin.length             },
      { indicador: 'Vencen próximos 7 días',               valor: vencen7                   },
      { indicador: 'Vencen próximos 30 días',              valor: vencen30                  },
      { indicador: 'Ya vencidos',                          valor: vencidos                  },
      { indicador: 'Sin fecha de vencimiento registrada',  valor: expes.length - conFin.length },
    ],
  }
})

const fechaRangoLabel = computed(() => {
  if (form.fechaDesde && form.fechaHasta) return `${form.fechaDesde} – ${form.fechaHasta}`
  return 'Sin rango seleccionado'
})
</script>

<template>
  <!-- Hero -->
  <div class="hero">
    <p class="hero-eyebrow">Análisis</p>
    <div class="hero-row">
      <div>
        <h1>Reportes</h1>
        <p>Generación de informes estadísticos y operativos de la UZDI</p>
      </div>
    </div>
  </div>

  <!-- Filtros -->
  <div class="card" style="margin-bottom:16px;">
    <div class="card-head">
      <h3>Configuración del reporte</h3>
      <p style="font-size:13px;color:var(--color-text-secondary);margin:0;">
        Los tipos de reporte disponibles se ajustan a su perfil. Los datos son siempre agregados.
      </p>
    </div>
    <div class="card-body">
      <div class="frow c3" style="margin-bottom:16px;">
        <div class="f">
          <label class="f-label" for="rep-tipo">Tipo de reporte <span class="req">*</span></label>
          <select id="rep-tipo" class="f-ctl" v-model="form.tipo">
            <option value="" disabled>Seleccione el tipo…</option>
            <option v-for="t in tiposDisponibles" :key="t" :value="t">{{ t }}</option>
          </select>
          <div v-if="tiposDisponibles.length === 0" class="f-err" role="alert">
            Su perfil no tiene tipos de reporte asignados.
          </div>
        </div>
        <div class="f">
          <label class="f-label" for="rep-periodo">Período</label>
          <select id="rep-periodo" class="f-ctl" v-model="form.periodo">
            <option>Mensual</option>
            <option>Trimestral</option>
            <option>Semestral</option>
            <option>Anual</option>
          </select>
        </div>
        <div class="f">
          <label class="f-label" for="rep-zona">Zona / UZDI <span class="req">*</span></label>
          <select id="rep-zona" class="f-ctl" v-model="form.zona" :disabled="!esSuperadmin">
            <option v-if="esSuperadmin" value="Todas las zonas">Todas las zonas</option>
            <option v-for="z in uzdiOptions" :key="z" :value="z">{{ z }}</option>
          </select>
          <div v-if="!esSuperadmin" class="f-help">Fijada a su UZDI por alcance de datos.</div>
        </div>
      </div>
      <div class="frow c2">
        <div class="f">
          <label class="f-label" for="rep-desde">Fecha desde <span class="req">*</span></label>
          <input id="rep-desde" class="f-ctl" type="date" v-model="form.fechaDesde" />
        </div>
        <div class="f">
          <label class="f-label" for="rep-hasta">Fecha hasta <span class="req">*</span></label>
          <input id="rep-hasta" class="f-ctl" type="date" v-model="form.fechaHasta" />
          <div v-if="rangoInvalido" class="f-err" role="alert">La fecha hasta no puede ser anterior a la fecha desde.</div>
        </div>
      </div>
      <div v-if="errorCarga" class="f-err" role="alert" style="margin-top:12px;">{{ errorCarga }}</div>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;padding-top:18px;border-top:1px solid var(--color-border);">
        <button class="btn btn-ghost" type="button" @click="resetForm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
          Limpiar
        </button>
        <button class="btn btn-primary" type="button" :disabled="loadingData || !formValido" @click="generar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 16V9"/><path d="M12 16V5"/><path d="M17 16v-7"/></svg>
          {{ loadingData ? 'Cargando datos…' : 'Generar reporte' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Empty state -->
  <div v-if="!generated" class="card">
    <div class="card-body">
      <div class="empty">
        <div class="empty-ico">
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 16V9"/><path d="M12 16V5"/><path d="M17 16v-7"/></svg>
        </div>
        <h3>Configure los parámetros para generar el reporte</h3>
        <p>Seleccione el tipo de reporte y haga clic en <b>Generar reporte</b>.</p>
      </div>
    </div>
  </div>

  <!-- Reporte con datos reales -->
  <div v-else class="card">
    <div class="card-head" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
      <div>
        <h3>{{ form.tipo || 'Estadístico general' }}</h3>
        <p style="font-size:13px;color:var(--color-text-secondary);margin:0;">
          {{ form.zona || 'Todas las zonas' }} · {{ form.periodo }} · {{ fechaRangoLabel }}
        </p>
      </div>
      <div class="no-print" style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-sm" type="button" title="Descarga CSV compatible con Excel" :disabled="!formValido" @click="exportarCSV">Exportar CSV (Excel)</button>
        <button class="btn btn-sm btn-primary" type="button" :disabled="!formValido" @click="descargarPDF">Imprimir o guardar PDF</button>
        <button class="btn btn-sm" type="button" title="Archivo Excel consolidado del backend; puede no respetar los filtros locales." :disabled="!!descargandoInstitucional" @click="descargarInstitucional('excel')">{{ descargandoInstitucional === 'excel' ? 'Descargando…' : 'Excel institucional (.xlsx)' }}</button>
        <button class="btn btn-sm" type="button" title="PDF consolidado del backend; puede no respetar los filtros locales." :disabled="!!descargandoInstitucional" @click="descargarInstitucional('pdf')">{{ descargandoInstitucional === 'pdf' ? 'Descargando…' : 'PDF institucional' }}</button>
      </div>
    </div>
    <div class="card-body">
      <!-- Stats reales -->
      <div class="stat-grid" style="margin-bottom:20px;">
        <div v-for="s in reporteData.stats" :key="s.label" class="stat">
          <div class="stat-top">
            <div :class="['stat-ico', s.color]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 16V9"/><path d="M12 16V5"/><path d="M17 16v-7"/></svg>
            </div>
          </div>
          <div class="stat-num">{{ s.num }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      </div>

      <!-- Tabla de indicadores reales -->
      <div v-if="reporteData.filas.length" class="tbl-card">
        <table class="tbl">
          <thead>
            <tr>
              <th>Indicador</th>
              <th style="text-align:right;">Cantidad</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in reporteData.filas" :key="f.indicador">
              <td>{{ f.indicador }}</td>
              <td style="text-align:right;font-weight:600;">{{ f.valor }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="empty" style="padding:24px;">
        <p>Sin datos para mostrar. Ajuste el rango de fechas o registre información primero.</p>
      </div>
    </div>
  </div>
</template>
