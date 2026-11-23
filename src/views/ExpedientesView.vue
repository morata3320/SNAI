<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { FolderPlus, Pencil, Lock, Save, X as XIcon } from '@lucide/vue'
import { expedienteService, type ExpedientePayload } from '../services/expediente.service'
import { adolescenteService } from '../services/adolescente.service'
import { useCatalogos } from '../composables/useCatalogos'
import { usePermisos } from '../composables/usePermisos'
import { useToast } from '../composables/useToast'

type ModalMode = 'new' | 'edit' | 'delete' | null

const { uzdis, infracciones, cargarCatalogos } = useCatalogos()
const { puede } = usePermisos()
const toast = useToast()

const puedeCrear = computed(() => puede('expedientes', 'create'))
const puedeEditar = computed(() => puede('expedientes', 'edit'))

const modal = ref<ModalMode>(null)
const selectedId = ref<number>(0)
const search = ref('')
const filterEstado = ref('Todos')
const page = ref(1)
const PAGE_SIZE = 7
const cargando = ref(false)
const error = ref('')

const rows = ref<Awaited<ReturnType<typeof expedienteService.getAll>>>([])
const adolescentes = ref<Awaited<ReturnType<typeof adolescenteService.getAll>>>([])

async function cargarTodo() {
  cargando.value = true
  error.value = ''
  try {
    await cargarCatalogos()
    ;[rows.value, adolescentes.value] = await Promise.all([
      expedienteService.getAll(),
      adolescenteService.getAll(),
    ])
  } catch {
    error.value = 'No se pudieron cargar los expedientes. Intenta nuevamente.'
    toast.error(error.value)
  } finally {
    cargando.value = false
  }
}

onMounted(cargarTodo)

const selectedCodigo = computed(() => {
  const row = rows.value.find(e => e.id === selectedId.value)
  return row?.codigo ?? ''
})

const ESTADOS = ['En proceso', 'Atraso', 'Incomparecencia', 'Concluido', 'Archivado'] as const
const ESTADOS_FORM = ESTADOS.filter(e => e !== 'Archivado')

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return rows.value.filter(r => {
    const matchSearch = !q || r.adol.toLowerCase().includes(q) || r.codigo.toLowerCase().includes(q) ||
      r.infraccion.toLowerCase().includes(q) || r.causa.toLowerCase().includes(q)
    const matchEstado = filterEstado.value === 'Todos' || r.estado === filterEstado.value
    return matchSearch && matchEstado
  })
})
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
const paged = computed(() => filtered.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))

const defaultForm = {
  adlc_id: 0,
  uzdi_id: 0,
  infc_id: 0,
  estado_procesal: 'En proceso' as ExpedientePayload['estado_procesal'],
  numero_causa: '',
  observaciones: '',
}
const form = reactive({ ...defaultForm })

const formValido = computed(() =>
  form.adlc_id > 0 && form.uzdi_id > 0 && form.infc_id > 0 &&
  !!form.estado_procesal && !!form.numero_causa.trim()
)

function openNew() {
  Object.assign(form, defaultForm)
  modal.value = 'new'
}
function openEdit(id: number) {
  const row = rows.value.find(r => r.id === id)!
  const raw = row._raw
  Object.assign(form, {
    adlc_id: raw.adlc_id ?? 0,
    uzdi_id: raw.uzdi_id ?? 0,
    infc_id: raw.infc_id ?? 0,
    estado_procesal: raw.estado_procesal,
    numero_causa: raw.numero_causa ?? '',
    observaciones: raw.observaciones ?? '',
  })
  selectedId.value = id
  modal.value = 'edit'
}
function openCerrar(id: number) {
  selectedId.value = id
  modal.value = 'delete'
}

async function handleSave() {
  const payload: ExpedientePayload = {
    adlc_id: form.adlc_id,
    uzdi_id: form.uzdi_id,
    infc_id: form.infc_id,
    estado_procesal: form.estado_procesal,
    numero_causa: form.numero_causa.trim(),
    observaciones: form.observaciones.trim() || undefined,
  }
  try {
    if (modal.value === 'edit') {
      await expedienteService.update(selectedId.value, payload)
      toast.success('Expediente actualizado correctamente')
    } else {
      await expedienteService.create(payload)
      toast.success('Expediente guardado correctamente')
    }
    rows.value = await expedienteService.getAll()
    modal.value = null
  } catch {
    toast.error('No se pudo guardar. Intenta nuevamente.')
  }
}

async function handleCerrar() {
  if (!selectedId.value) return
  try {
    await expedienteService.update(selectedId.value, { estado_procesal: 'Concluido' })
    rows.value = await expedienteService.getAll()
    toast.success('Expediente cerrado; queda en solo consulta y conserva su historial.')
    modal.value = null
  } catch {
    toast.error('No se pudo cerrar el expediente. Intenta nuevamente.')
  }
}

function onSearchInput() { page.value = 1 }
function onFilterChange() { page.value = 1 }

const selectedRow = () => rows.value.find(r => r.id === selectedId.value)
</script>

<template>
  <!-- Hero -->
  <div class="hero">
    <p class="hero-eyebrow">Gestión</p>
    <div class="hero-row">
      <div>
        <h1>Expedientes</h1>
        <p>Registro de expedientes socioeducativos vinculados a cada adolescente</p>
      </div>
    </div>
  </div>

  <!-- Toolbar -->
  <div class="toolbar">
    <div class="tool-search">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <input v-model="search" placeholder="Buscar por código, adolescente o infracción…" @input="onSearchInput" />
    </div>
    <select class="tool-select" v-model="filterEstado" @change="onFilterChange">
      <option value="Todos">Estado: Todos</option>
      <option v-for="e in ESTADOS" :key="e" :value="e">{{ e }}</option>
    </select>
    <div class="spacer" />
    <button v-if="puedeCrear" class="btn btn-primary" type="button" @click="openNew">
      <FolderPlus :size="17" />
      Nuevo expediente
    </button>
  </div>

  <!-- Tabla -->
  <div class="tbl-card">
    <table class="tbl">
      <thead>
        <tr>
          <th>N.º Expediente / causa</th>
          <th>Adolescente</th>
          <th>Infracción</th>
          <th>UZDI</th>
          <th>Estado</th>
          <th style="text-align:right;">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="e in paged" :key="e.id">
          <td>
            <div class="td-name">
              <b><span class="pill">{{ e.codigo }}</span></b>
              <span>{{ e.causa }}</span>
            </div>
          </td>
          <td>
            <div class="td-name">
              <b>{{ e.adol }}</b>
              <span>{{ e.ced }}</span>
            </div>
          </td>
          <td>{{ e.infraccion }}</td>
          <td>{{ e.uzdi }}</td>
          <td>
            <span :class="['badge', e.tono]">
              <span class="bdot" />{{ e.estado }}
            </span>
          </td>
          <td class="td-actions">
            <div class="row">
              <button v-if="puedeEditar && !['Concluido', 'Archivado'].includes(e.estado)" class="ico-btn" type="button" title="Editar" @click="openEdit(e.id)">
                <Pencil :size="16" />
              </button>
              <button v-if="puedeEditar && !['Concluido', 'Archivado'].includes(e.estado)" class="ico-btn danger" type="button" title="Concluir expediente" @click="openCerrar(e.id)">
                <Lock :size="16" />
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="cargando">
          <td colspan="6" style="text-align:center;padding:32px;color:var(--color-text-muted);">Cargando expedientes…</td>
        </tr>
        <tr v-else-if="error">
          <td colspan="6" style="text-align:center;padding:32px;color:var(--color-carmesi, #b42318);">{{ error }}</td>
        </tr>
        <tr v-else-if="paged.length === 0">
          <td colspan="6" style="text-align:center;padding:32px;color:var(--color-text-muted);">Sin resultados para los filtros aplicados</td>
        </tr>
      </tbody>
    </table>
    <div class="pag">
      <div class="pag-info">Mostrando <b>{{ filtered.length === 0 ? 0 : (page-1)*PAGE_SIZE+1 }}–{{ Math.min(page*PAGE_SIZE, filtered.length) }}</b> de <b>{{ filtered.length }}</b> registros</div>
      <div class="pag-ctrl">
        <button class="pag-btn" :class="{ 'is-disabled': page === 1 }" :disabled="page === 1" type="button" @click="page--">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <button
          v-for="p in totalPages" :key="p"
          class="pag-btn" :class="{ 'is-active': p === page }"
          type="button" @click="page = p"
        >{{ p }}</button>
        <button class="pag-btn" :class="{ 'is-disabled': page === totalPages }" :disabled="page === totalPages" type="button" @click="page++">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  </div>

  <!-- Modal crear / editar expediente -->
  <div v-if="modal === 'new' || modal === 'edit'" class="backdrop">
    <div class="modal md">
      <div class="modal-head">
        <div>
          <p class="eyebrow">Gestión · Expedientes</p>
          <h3>{{ modal === 'new' ? 'Crear expediente' : `Editar expediente · ${selectedCodigo}` }}</h3>
        </div>
        <button class="x" type="button" @click="modal = null">
          <XIcon :size="18" />
        </button>
      </div>
      <div class="modal-body">
        <div class="fsec">
          <div class="fsec-title">Datos judiciales</div>
          <div class="frow">
            <div class="f">
              <label class="f-label" for="exp-causa">N.º de causa <span class="req">*</span></label>
              <input id="exp-causa" class="f-ctl" v-model="form.numero_causa" placeholder="Ej. CAUSA-2026-0123" />
            </div>
          </div>
          <div class="frow" style="margin-top:16px;">
            <div class="f">
              <label class="f-label" for="exp-obs">Observaciones</label>
              <textarea id="exp-obs" class="f-ctl" rows="2" v-model="form.observaciones" placeholder="Notas de seguimiento del expediente…" />
            </div>
          </div>
        </div>
        <div class="fsec" style="margin-top:24px;">
          <div class="fsec-title">Vínculos del expediente</div>
          <div class="frow c2">
            <div class="f">
              <div class="f-label">Adolescente <span class="req">*</span></div>
              <select class="f-ctl" v-model="form.adlc_id">
                <option :value="0">Seleccione un adolescente…</option>
                <option v-for="a in adolescentes" :key="a.id" :value="a.id">{{ a.nombre }} ({{ a.ced }})</option>
              </select>
            </div>
            <div class="f">
              <div class="f-label">Estado <span class="req">*</span></div>
              <select class="f-ctl" v-model="form.estado_procesal">
                <option v-for="e in ESTADOS_FORM" :key="e" :value="e">{{ e }}</option>
              </select>
            </div>
          </div>
          <div class="frow c2" style="margin-top:16px;">
            <div class="f">
              <div class="f-label">UZDI <span class="req">*</span></div>
              <select class="f-ctl" v-model="form.uzdi_id">
                <option :value="0">Seleccione una UZDI…</option>
                <option v-for="u in uzdis" :key="u.id" :value="u.id">{{ u.nombre }}</option>
              </select>
            </div>
            <div class="f">
              <div class="f-label">Infracción <span class="req">*</span></div>
              <select class="f-ctl" v-model="form.infc_id">
                <option :value="0">Seleccione una infracción…</option>
                <option v-for="i in infracciones" :key="i.id" :value="i.id">{{ i.nombre }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" type="button" @click="modal = null">
          <XIcon :size="15" /> Cancelar
        </button>
        <button class="btn btn-primary" type="button" :disabled="!formValido" @click="handleSave">
          <Save :size="15" />
          {{ modal === 'new' ? 'Crear expediente' : 'Guardar cambios' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Modal cerrar expediente -->
  <div v-if="modal === 'delete'" class="backdrop">
    <div class="modal sm">
      <div class="modal-head">
        <h3>Cerrar expediente</h3>
        <button class="x" type="button" @click="modal = null">
          <XIcon :size="18" />
        </button>
      </div>
      <div class="modal-body">
        <div class="confirm">
          <div class="confirm-ico">
            <Lock :size="30" />
          </div>
          <h3>¿Cerrar este expediente?</h3>
          <p>El expediente quedará en solo consulta: no se podrá editar ni agregar movimientos, pero conservará todo su historial.</p>
          <span v-if="selectedRow()" class="name">{{ selectedRow()!.adol }} · {{ selectedCodigo }}</span>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" type="button" @click="modal = null">
          <XIcon :size="15" /> Cancelar
        </button>
        <button class="btn btn-primary" type="button" @click="handleCerrar">
          <Lock :size="15" />
          Cerrar expediente
        </button>
      </div>
    </div>
  </div>
</template>
