<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { FileText, Printer, Sparkles } from '@lucide/vue'
import api from '../services/api'
import { adolescenteService } from '../services/adolescente.service'
import { createCrudService } from '../services/crud.service'
import { ENDPOINTS } from '../services/backend-contract'
import { usePermisos } from '../composables/usePermisos'
import { useToast } from '../composables/useToast'
import { INFORME_TECNICO_SECCIONES } from '../config/pendientes'
import { calcularEdad, formatFecha } from '../utils/validators'
import type { Registro } from '../entities/registry'

interface Seccion {
  titulo: string
  filas: string[]
}

interface InformeCreado {
  id: number
  tipo: string
}

const toast = useToast()
const { visible, puede } = usePermisos()

const adolescentes = ref<Awaited<ReturnType<typeof adolescenteService.getAll>>>([])
const cargandoAdolescentes = ref(true)
const generando = ref(false)
const generado = ref<InformeCreado | null>(null)
const secciones = ref<Seccion[]>([])

const form = reactive({
  adlc_id: 0,
  tipo: 'Informe técnico integral',
  desde: '',
  hasta: '',
})

const TIPOS = [
  'Informe técnico integral',
  'Informe de seguimiento',
  'Informe de cierre',
]

const puedeGenerar = computed(() => puede('informes', 'create'))
const seleccionado = computed(() => adolescentes.value.find((a) => a.id === form.adlc_id) ?? null)
const periodoTexto = computed(() => `${formatFecha(form.desde)} al ${formatFecha(form.hasta)}`)

onMounted(async () => {
  try {
    adolescentes.value = await adolescenteService.getAll()
  } catch {
    toast.error('No se pudieron cargar los adolescentes.')
  } finally {
    cargandoAdolescentes.value = false
  }
})

function enPeriodo(fecha: unknown): boolean {
  const dia = String(fecha ?? '').slice(0, 10)
  if (!dia) return true
  if (form.desde && dia < form.desde) return false
  if (form.hasta && dia > form.hasta) return false
  return true
}

function nombreObjeto(valor: unknown): string {
  if (!valor || typeof valor !== 'object') return ''
  const obj = valor as Record<string, unknown>
  return `${String(obj.nombre ?? '')} ${String(obj.apellido ?? '')}`.trim()
}

async function filasDe(path: string, modulo: Parameters<typeof visible>[0]): Promise<Registro[]> {
  if (!visible(modulo)) return []
  try {
    return await createCrudService<Registro, Record<string, unknown>>(path).getAll()
  } catch {
    return []
  }
}

function validar(): boolean {
  if (!form.adlc_id) {
    toast.error('Seleccione un adolescente.')
    return false
  }
  if (!form.desde || !form.hasta) {
    toast.error('Indique el periodo del informe.')
    return false
  }
  if (form.hasta < form.desde) {
    toast.error('La fecha final no puede ser anterior a la inicial.')
    return false
  }
  return true
}

async function generar(): Promise<void> {
  if (!validar() || !seleccionado.value) return
  generando.value = true
  generado.value = null
  try {
    const adlc = form.adlc_id

    const [expedientes, representantes, contexto, fichas, educacion, alertas, documentos, medidas] =
      await Promise.all([
        filasDe('/expediente', 'expedientes'),
        filasDe('/representante', 'representantes'),
        filasDe('/contexto-familiar/intervencion', 'contexto-familiar'),
        filasDe('/ficha-psicologica', 'fichas'),
        filasDe('/informacion-educativa', 'educacion'),
        filasDe('/alerta-salud', 'alertas-salud'),
        filasDe(ENDPOINTS.documentoExpediente, 'documentos'),
        filasDe(ENDPOINTS.medidaExpediente, 'medidas'),
      ])

    const delAdolescente = (row: Registro): boolean => Number(row['adlc_id']) === adlc && enPeriodo(row['fecha'] ?? row['fecha_inicio'])
    const nuevas: Seccion[] = []

    const raw = seleccionado.value._raw
    nuevas.push({
      titulo: 'Datos de identificación',
      filas: [
        `Nombre completo: ${raw.nombre} ${raw.apellido}`,
        `Cédula: ${raw.cedula}`,
        `Fecha de nacimiento: ${formatFecha(raw.fecha_nac)} · Edad: ${calcularEdad(raw.fecha_nac)} años`,
        `Fecha de ingreso: ${formatFecha(raw.fecha_ingr)}`,
        `Nacionalidad: ${raw.nacionalidad?.nombre ?? '—'} · Cantón: ${raw.canton?.nombre ?? '—'}`,
      ],
    })

    nuevas.push({
      titulo: 'Motivo del informe',
      filas: [
        `Tipo: ${form.tipo}`,
        `Periodo analizado: ${periodoTexto.value}`,
        'Generado desde el Sistema UZDI con los registros accesibles al perfil del usuario.',
      ],
    })

    const familia = representantes.filter((r) => {
      const vinculados = Array.isArray(r['adolescentes']) ? (r['adolescentes'] as Record<string, unknown>[]) : []
      return vinculados.some((v) => Number(v['id']) === adlc)
    })
    const intervenciones = contexto.filter(delAdolescente)
    if (familia.length || intervenciones.length) {
      const filas = [
        ...familia.map((r) => `Representante: ${String(r['nombres'])} ${String(r['apellidos'])} · ${String(r['parentesco'])} · ${String(r['telefono'])}`),
        ...intervenciones.map((c) => `Intervención ${formatFecha(String(c['fecha']))}: ${String(c['motivo'])}`),
      ]
      nuevas.push({ titulo: 'Antecedentes familiares', filas })
    }

    const edu = educacion.filter(delAdolescente)
    if (edu.length) {
      nuevas.push({
        titulo: 'Situación educativa',
        filas: edu.map((e) => `${String(e['nivel'])} · ${String(e['institucion'])} · ${String(e['estado'])}`),
      })
    }

    const psi = fichas.filter(delAdolescente)
    if (psi.length) {
      nuevas.push({
        titulo: 'Proceso psicológico',
        filas: psi.map((f) => `${formatFecha(String(f['fecha']))} · ${String(f['tipo'])} · ${String(f['motivo'])}`),
      })
    }

    const casos = expedientes.filter((e) => Number(e['adlc_id']) === adlc)
    const asignadas = medidas.filter(delAdolescente)
    if (casos.length || asignadas.length) {
      const filas = [
        ...casos.map((e) => `Expediente ${String(e['num_causa'] ?? `#${e.id}`)} · ${String(e['estado'])} · ${String(e['juzgado'] ?? '')}`),
        ...asignadas.map((m) => {
          const medida = nombreObjeto(m['medida'])
          return `Medida ${medida || `#${String(m['mdso_id'])}`} · ${formatFecha(String(m['fecha_inicio']))} a ${formatFecha(String(m['fecha_fin']))} · ${String(m['estado'])}`
        }),
      ]
      nuevas.push({ titulo: 'Cumplimiento de medida', filas })
    }

    const salud = alertas.filter(delAdolescente)
    if (salud.length) {
      nuevas.push({
        titulo: 'Alertas de salud',
        filas: salud.map((a) => `${formatFecha(String(a['fecha']))} · ${String(a['tipo'])} · ${String(a['estado'])}`),
      })
    }

    const docs = documentos.filter((d) => Number(d['adlc_id']) === adlc && enPeriodo(d['fecha_registro']))
    if (docs.length) {
      nuevas.push({
        titulo: 'Documentos y actuaciones',
        filas: docs.map((d) => `${String(d['tipo'])} ${String(d['numero'])} · ${String(d['emisor'])} · ${String(d['estado'])}`),
      })
    }

    nuevas.push({
      titulo: 'Conclusiones y recomendaciones',
      filas: [
        'Sección por completar por el equipo técnico responsable.',
        `Secciones de la plantilla de referencia: ${INFORME_TECNICO_SECCIONES.length}. Plantilla definitiva por definir con la Directora de la UZDI y el SNAI.`,
      ],
    })

    const { data } = await api.post<InformeCreado>('/informe-tecnico', {
      adlc_id: adlc,
      tipo: form.tipo,
      periodo_desde: form.desde,
      periodo_hasta: form.hasta,
      secciones: nuevas.map((s) => s.titulo),
    })

    secciones.value = nuevas
    generado.value = data
    toast.success(`Se generó el informe técnico #${data.id} y quedó registrado en la bitácora.`)
  } catch {
    toast.error('No se pudo generar el informe técnico. Intente nuevamente.')
  } finally {
    generando.value = false
  }
}

function imprimir(): void {
  window.print()
}
</script>

<template>
  <div class="hero no-print">
    <p class="hero-eyebrow">Análisis</p>
    <div class="hero-row">
      <div>
        <h1>Informe técnico del adolescente</h1>
        <p>Reúne solo los registros a los que su perfil tiene acceso. No sustituye al reporte estadístico.</p>
      </div>
    </div>
  </div>

  <div class="card no-print">
    <div class="fsec" style="margin:0;">
      <div class="fsec-title">Datos del informe</div>
      <div class="frow">
        <div class="f" style="grid-column:1/-1;">
          <label class="f-label" for="inf-adlc">Adolescente <span class="req">*</span></label>
          <select id="inf-adlc" v-model.number="form.adlc_id" class="f-ctl" :disabled="cargandoAdolescentes">
            <option :value="0" disabled>{{ cargandoAdolescentes ? 'Cargando adolescentes…' : 'Seleccione un adolescente…' }}</option>
            <option v-for="a in adolescentes" :key="a.id" :value="a.id">{{ a.nombre }} · {{ a.ced }}</option>
          </select>
        </div>
        <div class="f">
          <label class="f-label" for="inf-tipo">Tipo de informe <span class="req">*</span></label>
          <select id="inf-tipo" v-model="form.tipo" class="f-ctl">
            <option v-for="t in TIPOS" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <div class="f">
          <span class="f-label">Periodo <span class="req">*</span></span>
          <div class="rango">
            <input v-model="form.desde" type="date" class="f-ctl" aria-label="Periodo desde" />
            <input v-model="form.hasta" type="date" class="f-ctl" aria-label="Periodo hasta" />
          </div>
        </div>
      </div>
      <div class="acciones">
        <span class="nota">Plantilla y firmante por definir con la Directora de la UZDI y el SNAI.</span>
        <button
          class="btn btn-primary"
          type="button"
          :disabled="generando || !puedeGenerar"
          :title="puedeGenerar ? undefined : 'Su perfil solo puede consultar informes.'"
          @click="generar"
        >
          <Sparkles :size="16" />
          {{ generando ? 'Generando…' : 'Generar informe' }}
        </button>
      </div>
    </div>
  </div>

  <article v-if="generado" class="informe">
    <header class="informe-head">
      <div>
        <p class="informe-eyebrow">Unidad Zonal de Desarrollo Integral</p>
        <h2>{{ generado.tipo }}</h2>
        <p class="informe-sub">Informe #{{ generado.id }} · Periodo {{ periodoTexto }}</p>
      </div>
      <button class="btn btn-sm no-print" type="button" @click="imprimir">
        <Printer :size="15" /> Imprimir o guardar PDF
      </button>
    </header>

    <section v-for="seccion in secciones" :key="seccion.titulo" class="informe-sec">
      <h3>{{ seccion.titulo }}</h3>
      <ul>
        <li v-for="fila in seccion.filas" :key="fila">{{ fila }}</li>
      </ul>
    </section>

    <footer class="firma">
      <div class="firma-linea" />
      <p>Firma del responsable</p>
      <p class="firma-nota">Plantilla por definir con la Directora de la UZDI y el SNAI.</p>
    </footer>
  </article>

  <div v-else class="vacio no-print">
    <FileText :size="26" />
    <p>Seleccione un adolescente y un periodo para generar el informe técnico.</p>
  </div>
</template>

<style scoped>
.card { padding: 16px; margin-bottom: 16px; }
.rango { display: flex; gap: 8px; }
.acciones {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
  flex-wrap: wrap;
}
.nota { font-size: 12.5px; color: var(--color-text-muted); }
.informe {
  padding: 26px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: #fff;
}
.informe-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 2px solid var(--color-brand-blue);
  padding-bottom: 14px;
  margin-bottom: 18px;
}
.informe-eyebrow {
  margin: 0 0 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: var(--color-brand-blue);
}
.informe-head h2 { margin: 0; font-size: 20px; color: var(--color-text-primary); }
.informe-sub { margin: 4px 0 0; font-size: 13px; color: var(--color-text-muted); }
.informe-sec { margin-bottom: 18px; }
.informe-sec h3 {
  margin: 0 0 7px;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: var(--color-text-secondary);
}
.informe-sec ul { margin: 0; padding-left: 18px; }
.informe-sec li { margin: 4px 0; font-size: 13.5px; line-height: 1.55; color: var(--color-text-primary); }
.firma { margin-top: 36px; text-align: center; }
.firma-linea {
  width: 260px;
  max-width: 80%;
  margin: 0 auto 7px;
  border-top: 1px solid var(--color-text-secondary);
}
.firma p { margin: 0; font-size: 13px; color: var(--color-text-secondary); }
.firma-nota { font-size: 11.5px !important; color: var(--color-text-muted) !important; margin-top: 2px !important; }
.vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 42px 16px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-lg);
  color: var(--color-text-muted);
  font-size: 13.5px;
}
@media print {
  .hero, .notice, .no-print { display: none !important; }
  .informe { border: 0; padding: 0; }
}
</style>
