<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Download, Lock } from '@lucide/vue'
import api from '../services/api'
import DataTable from '../components/ui/DataTable.vue'
import { useToast } from '../composables/useToast'
import { formatFechaHora } from '../utils/validators'
import { ENDPOINTS } from '../services/backend-contract'
import { listaDe } from '../services/response'

interface Evento {
  id: number
  fecha: string
  usuario_id: number | null
  usuario: string
  tipo: string
  entidad: string
  entidad_id: number | null
  detalle: string
}

const toast = useToast()
const rows = ref<Evento[]>([])
const cargando = ref(false)
const error = ref<string | null>(null)
const search = ref('')
const tipo = ref('')
const desde = ref('')
const hasta = ref('')
const page = ref(1)
const pageSize = 10

const columns = [
  { key: 'fecha', label: 'Fecha', width: '150px' },
  { key: 'usuario', label: 'Usuario', width: '130px' },
  { key: 'tipo', label: 'Evento', width: '180px' },
  { key: 'entidad', label: 'Entidad', width: '120px' },
  { key: 'detalle', label: 'Detalle' },
]

async function cargar(): Promise<void> {
  cargando.value = true
  error.value = null
  try {
    const { data } = await api.get<Evento[]>(ENDPOINTS.historial)
    rows.value = listaDe<Evento>(data)
  } catch {
    error.value = 'No se pudo cargar la bitácora de seguridad.'
    toast.error(error.value)
  } finally {
    cargando.value = false
  }
}

onMounted(cargar)

const tipos = computed(() => [...new Set(rows.value.map((e) => e.tipo))].sort())

const filtrados = computed(() => {
  const q = search.value.trim().toLowerCase()
  return rows.value.filter((e) => {
    if (tipo.value && e.tipo !== tipo.value) return false
    const dia = e.fecha.slice(0, 10)
    if (desde.value && dia < desde.value) return false
    if (hasta.value && dia > hasta.value) return false
    if (!q) return true
    return [e.usuario, e.tipo, e.entidad, e.detalle].some((v) => String(v ?? '').toLowerCase().includes(q))
  })
})

const paged = computed(() => filtrados.value.slice((page.value - 1) * pageSize, page.value * pageSize))

function reiniciar(): void {
  search.value = ''
  tipo.value = ''
  desde.value = ''
  hasta.value = ''
  page.value = 1
}
</script>

<template>
  <div class="hero">
    <p class="hero-eyebrow">Seguridad</p>
    <div class="hero-row">
      <div>
        <h1>Bitácora de seguridad</h1>
        <p>Registro inmutable de eventos del sistema. Solo lectura para el Superadministrador.</p>
      </div>
      <button
        class="btn btn-ghost"
        type="button"
        disabled
        title="Retención y exportación por definir con el SNAI"
      >
        <Download :size="16" /> Exportar
      </button>
    </div>
  </div>

  <div class="notice" role="note">
    <Lock :size="16" />
    <span>La bitácora no puede editarse ni borrarse desde la interfaz. Los eventos no incluyen nombres de adolescentes.</span>
  </div>

  <div class="toolbar">
    <div class="tool-search">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <input v-model="search" placeholder="Buscar usuario, evento o detalle…" aria-label="Buscar en bitácora" @input="page = 1" />
    </div>
    <select v-model="tipo" class="tool-select" aria-label="Tipo de evento" @change="page = 1">
      <option value="">Todos los eventos</option>
      <option v-for="t in tipos" :key="t" :value="t">{{ t }}</option>
    </select>
    <label class="fecha">
      <span>Desde</span>
      <input v-model="desde" type="date" class="f-ctl" @change="page = 1" />
    </label>
    <label class="fecha">
      <span>Hasta</span>
      <input v-model="hasta" type="date" class="f-ctl" @change="page = 1" />
    </label>
    <button class="btn btn-ghost" type="button" @click="reiniciar">Limpiar</button>
  </div>

  <DataTable
    :columns="columns"
    :rows="paged"
    :total="filtrados.length"
    :page="page"
    :page-size="pageSize"
    :cargando="cargando"
    :error="error"
    empty-title="Sin eventos"
    empty-message="No hay eventos de bitácora para los filtros aplicados."
    @update:page="page = $event"
    @retry="cargar"
  >
    <template #row="{ row }">
      <td>{{ formatFechaHora(row.fecha) }}</td>
      <td><span class="pill">{{ row.usuario }}</span></td>
      <td>{{ row.tipo }}</td>
      <td>{{ row.entidad }} #{{ row.entidad_id ?? '—' }}</td>
      <td>{{ row.detalle }}</td>
    </template>
  </DataTable>
</template>

<style scoped>
.notice {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin-bottom: 14px;
  padding: 11px 14px;
  border-left: 4px solid var(--color-brand-blue);
  border-radius: var(--radius-md);
  background: var(--color-info-bg);
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}
.toolbar { flex-wrap: wrap; }
.fecha {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--color-text-muted);
}
.fecha .f-ctl { width: 145px; }
@media (max-width: 720px) {
  .fecha { width: 100%; }
  .fecha .f-ctl { width: 100%; }
}
</style>
