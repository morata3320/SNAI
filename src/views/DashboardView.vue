<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { usePermisos } from '../composables/usePermisos'
import { roleKey } from '../router/access'
import { adolescenteService } from '../services/adolescente.service'
import { expedienteService } from '../services/expediente.service'
import DashboardSkeleton from '../components/dashboard/DashboardSkeleton.vue'
import DashBarChart      from '../components/dashboard/DashBarChart.vue'
import DashDonut         from '../components/dashboard/DashDonut.vue'
import RevisionListCard  from '../components/dashboard/RevisionListCard.vue'
import QuickAccessCard   from '../components/dashboard/QuickAccessCard.vue'
import api from '../services/api'
import { ENDPOINTS } from '../services/backend-contract'
import { listaDe } from '../services/response'

interface FichaRow { id: number; fecha: string; activo?: boolean }
interface TallerRow { id: number; nombre: string; fecha: string; activo?: boolean }
interface AlertaRow { id: number; estado: string; activo?: boolean }
interface AsignacionRow { id: number; expediente_id: number; activo?: boolean }
interface BitacoraRow { id: number; fecha: string; tipo: string; detalle: string }

const router = useRouter()
const { user } = useAuth()
const { visible } = usePermisos()
const loading = ref(true)
const errorCarga = ref('')

type AdolRow = Awaited<ReturnType<typeof adolescenteService.getAll>>[number]
type ExpeRow = Awaited<ReturnType<typeof expedienteService.getAll>>[number]

const adolescentes = ref<AdolRow[]>([])
const expedientes  = ref<ExpeRow[]>([])
const fichas = ref<FichaRow[]>([])
const talleres = ref<TallerRow[]>([])
const alertas = ref<AlertaRow[]>([])
const asignaciones = ref<AsignacionRow[]>([])
const bitacora = ref<BitacoraRow[]>([])

const rol = computed(() => roleKey((user.value?.['tppr_id'] as number | undefined) ?? null))
const puedeVerExpedientes = computed(() => visible('expedientes'))

async function cargarPanel() {
  const tareas: Promise<void>[] = []
  if (visible('adolescentes')) {
    tareas.push(adolescenteService.getAll().then(rows => { adolescentes.value = rows }))
  }
  if (visible('expedientes')) {
    tareas.push(expedienteService.getAll().then(rows => { expedientes.value = rows }))
  }
  if (visible('fichas')) {
    tareas.push(api.get<FichaRow[]>('/ficha-psicologica').then(({ data }) => {
      fichas.value = data.filter(f => f.activo !== false)
    }))
  }
  if (visible('talleres')) {
    tareas.push(api.get<TallerRow[]>(ENDPOINTS.taller).then(({ data }) => {
      talleres.value = listaDe<TallerRow>(data).filter(t => t.activo !== false)
    }))
  }
  if (visible('alertas-salud')) {
    tareas.push(api.get<AlertaRow[]>('/alerta-salud').then(({ data }) => {
      alertas.value = data.filter(a => a.activo !== false)
    }))
  }
  if (visible('asignacion-casos')) {
    tareas.push(api.get<AsignacionRow[]>('/asignacion-caso').then(({ data }) => {
      asignaciones.value = data.filter(a => a.activo !== false)
    }))
  }
  if (visible('bitacora')) {
    tareas.push(api.get<BitacoraRow[]>(ENDPOINTS.historial).then(({ data }) => {
      bitacora.value = listaDe<BitacoraRow>(data)
    }))
  }
  const resultados = await Promise.allSettled(tareas)
  if (resultados.some(r => r.status === 'rejected')) {
    errorCarga.value = 'Algunos indicadores no pudieron cargarse. Intente actualizar la página.'
  }
}

onMounted(async () => {
  try {
    await cargarPanel()
  } finally {
    loading.value = false
  }
})

// Saludo dinámico
const saludo = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
})

const userName = computed(() => {
  if (!user.value) return ''
  return (user.value['nombres'] as string) ?? (user.value['prsnnmbr'] as string) ?? 'usuario'
})

const fechaHoy = computed(() => {
  const d = new Date()
  const dias = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  return `${dias[d.getDay()]}, ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`
})

// Contadores reales
const totalAdolescentes = computed(() => adolescentes.value.length)
const enProceso         = computed(() => expedientes.value.filter(e => e.estado === 'En proceso').length)
const conAlerta         = computed(() => expedientes.value.filter(e => e.estado === 'Atraso' || e.estado === 'Incomparecencia').length)
const totalExpedientes  = computed(() => expedientes.value.length)
const talleresProximos  = computed(() => talleres.value.filter(t => t.fecha >= new Date().toISOString().slice(0, 10)).length)
const alertasPendientes = computed(() => alertas.value.filter(a => a.estado === 'Pendiente').length)
const casosSinAsignar   = computed(() => {
  const asignados = new Set(asignaciones.value.map(a => a.expediente_id))
  return expedientes.value.filter(e => !asignados.has(e.id)).length
})
const ultimoEvento = computed(() => {
  if (!bitacora.value.length) return null
  return [...bitacora.value].sort((a, b) => b.fecha.localeCompare(a.fecha))[0]
})

const iconAdol = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
const iconExpe = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M5 7h14"/><path d="m5 7-3 6h6l-3-6Z"/><path d="m19 7-3 6h6l-3-6Z"/><path d="M7 21h10"/></svg>`
const iconAlerta = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`
const iconTaller = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`

interface StatCard {
  color: string
  num: string
  label: string
  delta: string
  dtone: string
  to: string
  icon: string
}

const stats = computed<StatCard[]>(() => {
  const items: StatCard[] = []
  if (visible('adolescentes')) {
    items.push({
      color: 'blue', num: String(totalAdolescentes.value), label: 'Adolescentes registrados',
      delta: '', dtone: 'flat', to: '/app/adolescentes', icon: iconAdol,
    })
  }
  if (puedeVerExpedientes.value) {
    items.push({
      color: 'green', num: String(enProceso.value), label: 'Expedientes en proceso',
      delta: '', dtone: 'flat', to: '/app/expedientes', icon: iconExpe,
    })
    items.push({
      color: 'amber', num: String(conAlerta.value), label: 'Con alerta (atraso / incomparecencia)',
      delta: conAlerta.value > 0 ? `${conAlerta.value} urgentes` : '', dtone: 'flat',
      to: '/app/expedientes', icon: iconAlerta,
    })
    if (rol.value === 'coordinador' && visible('asignacion-casos')) {
      items.push({
        color: 'slate', num: String(casosSinAsignar.value), label: 'Casos sin asignar',
        delta: '', dtone: 'flat', to: '/app/asignacion-casos', icon: iconExpe,
      })
    } else if (rol.value === 'tsocial' && visible('alertas-salud')) {
      items.push({
        color: 'red', num: String(alertasPendientes.value), label: 'Alertas de salud pendientes',
        delta: '', dtone: 'flat', to: '/app/alertas-salud', icon: iconAlerta,
      })
    } else {
      items.push({
        color: 'slate', num: String(totalExpedientes.value), label: 'Total expedientes',
        delta: '', dtone: 'flat', to: '/app/expedientes', icon: iconExpe,
      })
    }
  } else {
    if (visible('talleres')) {
      items.push({
        color: 'green', num: String(talleresProximos.value), label: 'Talleres próximos',
        delta: '', dtone: 'flat', to: '/app/talleres', icon: iconTaller,
      })
    }
    if (visible('fichas')) {
      items.push({
        color: 'slate', num: String(fichas.value.length), label: 'Fichas psicológicas registradas',
        delta: '', dtone: 'flat', to: '/app/fichas', icon: iconExpe,
      })
    }
    if (visible('alertas-salud')) {
      items.push({
        color: 'amber', num: String(alertasPendientes.value), label: 'Alertas de salud pendientes',
        delta: '', dtone: 'flat', to: '/app/alertas-salud', icon: iconAlerta,
      })
    }
  }
  return items
})

// Bar chart: expedientes agrupados por tipo de medida
const barData = computed(() => {
  const counts: Record<string, number> = {}
  for (const e of expedientes.value) {
    const name = e.medida || 'Sin medida'
    counts[name] = (counts[name] ?? 0) + 1
  }
  return Object.entries(counts)
    .map(([l, v]) => ({ l: l.length > 16 ? l.substring(0, 14) + '…' : l, v }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 5)
})

// Donut: expedientes por estado
const donutData = computed(() => [
  { l: 'En proceso',      v: expedientes.value.filter(e => e.estado === 'En proceso').length,      c: '#16a34a' },
  { l: 'Atraso',          v: expedientes.value.filter(e => e.estado === 'Atraso').length,          c: '#ea580c' },
  { l: 'Incomparecencia', v: expedientes.value.filter(e => e.estado === 'Incomparecencia').length, c: '#dc2626' },
].filter(d => d.v > 0))

// Revisiones: expedientes con fecha_fin_medida, ordenados por fecha más próxima
const revisionData = computed(() =>
  [...expedientes.value]
    .filter(e => e._raw.fecha_fin_medida)
    .sort((a, b) =>
      new Date(a._raw.fecha_fin_medida!).getTime() - new Date(b._raw.fecha_fin_medida!).getTime()
    )
    .slice(0, 5)
    .map(e => ({
      adol:   e.adol,
      medida: e.medida,
      fin:    e.fin,
      estado: e.estado,
      tono:   e.tono,
    }))
)
</script>

<template>
  <DashboardSkeleton v-if="loading" />

  <template v-else>
    <div v-if="errorCarga" class="card" style="margin-bottom:16px;">
      <div class="card-body" role="alert" style="color:var(--color-error);font-size:13.5px;">
        {{ errorCarga }}
      </div>
    </div>

    <!-- Hero -->
    <div class="hero">
      <p class="hero-eyebrow">Panel principal</p>
      <div class="hero-row">
        <div>
          <h1>{{ saludo }}, {{ userName }}</h1>
          <p>Resumen operativo — {{ fechaHoy }}</p>
        </div>
      </div>
    </div>

    <div v-if="ultimoEvento" class="card" style="margin-bottom:16px;">
      <div class="card-body" style="font-size:13.5px;color:var(--color-text-secondary);">
        <b>Último evento de bitácora:</b> {{ ultimoEvento.tipo }} · {{ ultimoEvento.detalle }}
      </div>
    </div>

    <!-- Stat cards por rol -->
    <div class="stat-grid">
      <div
        v-for="s in stats" :key="s.label"
        class="stat stat--link"
        role="link"
        tabindex="0"
        @click="router.push(s.to)"
        @keydown.enter="router.push(s.to)"
      >
        <div class="stat-top">
          <div :class="['stat-ico', s.color]">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span v-html="s.icon" style="display:contents" />
          </div>
          <span v-if="s.delta" :class="['stat-delta', s.dtone]">{{ s.delta }}</span>
        </div>
        <div class="stat-num">{{ s.num }}</div>
        <div class="stat-label">{{ s.label }}</div>
      </div>
    </div>

    <!-- Bar chart + Donut (solo perfiles con acceso a expedientes) -->
    <div v-if="puedeVerExpedientes" class="grid-2" style="margin-bottom:16px;">
      <DashBarChart :items="barData" />
      <DashDonut    :items="donutData" />
    </div>

    <!-- Revisiones + Quick access -->
    <div class="grid-2" :style="!puedeVerExpedientes ? 'grid-template-columns:1fr;' : ''">
      <RevisionListCard v-if="puedeVerExpedientes" :items="revisionData" />
      <QuickAccessCard />
    </div>
  </template>
</template>
