<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { adolescenteService } from '../services/adolescente.service'
import { useCatalogos } from '../composables/useCatalogos'
import { usePermisos } from '../composables/usePermisos'
import { useToast } from '../composables/useToast'
import { validarCedulaEC, fechaNoFutura } from '../utils/validators'
import { UserPlus, Pencil, Ban, Eye, Save, X } from '@lucide/vue'

type ModalMode = 'new' | 'edit' | 'deactivate' | null

const router = useRouter()
const modal = ref<ModalMode>(null)
const selectedId = ref<number>(0)
const search = ref('')
const filterNacionalidad = ref('Todas')
const page = ref(1)
const PAGE_SIZE = 8
const cargando = ref(false)

const { nacionalidades, estadosCiviles, etnias, gdos, cantones, provincias, cargarCatalogos } = useCatalogos()
const { puede } = usePermisos()
const toast = useToast()

const puedeCrear = computed(() => puede('adolescentes', 'create'))
const puedeEditar = computed(() => puede('adolescentes', 'edit'))
const puedeRetirar = computed(() => puede('adolescentes', 'deactivate'))
const puedeVerExpedientes = computed(() => puede('expedientes', 'view'))

const rows = ref<Awaited<ReturnType<typeof adolescenteService.getAll>>>([])

async function cargarAdolescentes() {
  cargando.value = true
  try {
    rows.value = await adolescenteService.getAll()
  } catch {
    toast.error('No se pudieron cargar los adolescentes. Intenta nuevamente.')
  } finally {
    cargando.value = false
  }
}

onMounted(async () => {
  await cargarCatalogos()
  await cargarAdolescentes()
})

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return rows.value.filter(r => {
    const matchSearch = !q || r.nombre.toLowerCase().includes(q) || r.ced.includes(q)
    const matchNac = filterNacionalidad.value === 'Todas' || r.nacionalidad === filterNacionalidad.value
    return matchSearch && matchNac
  })
})
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
const paged = computed(() => filtered.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))

const defaultForm = {
  id: 0, nombre: '', apellido: '', ced: '', fecha_nac: '', sexo: '', fecha_ingr: '',
  nacn_id: 0, etcv_id: 0, etna_id: 0, provincia_id: 0, cntn_id: 0, gdo_id: 0,
  hijos: 0, reincide: false, hijoPpl: false, nved_nombre: '', obs: '',
}
const form = reactive({ ...defaultForm })

const cantonesFiltrados = computed(() =>
  form.provincia_id ? cantones.value.filter(c => c.provincia_id === form.provincia_id) : [],
)

function provinciaDeCanton(cntnId: number): number {
  return cantones.value.find(c => c.id === cntnId)?.provincia_id ?? 0
}

function onProvinciaChange() {
  form.cntn_id = 0
}

function openNew() {
  Object.assign(form, { ...defaultForm })
  modal.value = 'new'
}
function openEdit(id: number) {
  const row = rows.value.find(r => r.id === id)!
  const raw = row._raw
  Object.assign(form, {
    id: row.id,
    nombre: raw.nombre,
    apellido: raw.apellido,
    ced: raw.cedula,
    fecha_nac: raw.fecha_nac?.substring(0, 10) ?? '',
    fecha_ingr: raw.fecha_ingr?.substring(0, 10) ?? '',
    sexo: raw.sexo,
    nacn_id: raw.nacionalidad?.id ?? raw.nacn_id ?? 0,
    etcv_id: raw.estadoCivil?.id ?? raw.etcv_id ?? 0,
    etna_id: raw.etnia?.id ?? raw.etna_id ?? 0,
    provincia_id: provinciaDeCanton(raw.canton?.id ?? raw.cntn_id ?? 0),
    cntn_id: raw.canton?.id ?? raw.cntn_id ?? 0,
    gdo_id: raw.gdo?.id ?? raw.gdo_id ?? 0,
    hijos: raw.hijos ?? 0,
    reincide: !!raw.reincide,
    hijoPpl: !!raw.hijoPpl,
    nved_nombre: raw.nved_nombre ?? '',
    obs: raw.observaciones ?? '',
  })
  selectedId.value = id
  modal.value = 'edit'
}
function openDeactivate(id: number) {
  selectedId.value = id
  modal.value = 'deactivate'
}

const formValido = computed(() =>
  !!form.nombre && !!form.apellido && validarCedulaEC(form.ced) && !!form.fecha_nac && !!form.sexo &&
  !!form.fecha_ingr && fechaNoFutura(form.fecha_ingr) &&
  form.nacn_id > 0 && form.etcv_id > 0 && form.etna_id > 0 &&
  form.provincia_id > 0 && form.cntn_id > 0,
)

async function handleSave() {
  if (!formValido.value) return
  const payload = {
    cedula: form.ced,
    nombre: form.nombre,
    apellido: form.apellido,
    fecha_nac: form.fecha_nac,
    sexo: form.sexo,
    fecha_ingr: form.fecha_ingr,
    nacn_id: Number(form.nacn_id),
    etcv_id: Number(form.etcv_id),
    etna_id: Number(form.etna_id),
    cntn_id: Number(form.cntn_id),
    gdo_id: form.gdo_id ? Number(form.gdo_id) : undefined,
    hijos: Number(form.hijos) || 0,
    reincide: form.reincide,
    hijoPpl: form.hijoPpl,
    nved_nombre: form.nved_nombre || undefined,
    observaciones: form.obs || undefined,
  }
  try {
    if (modal.value === 'edit') {
      await adolescenteService.update(form.id, payload)
      toast.success('Registro actualizado correctamente')
    } else {
      await adolescenteService.create(payload)
      toast.success('Registro guardado correctamente')
    }
    await cargarAdolescentes()
    modal.value = null
  } catch (e) {
    const status = (e as { response?: { status?: number } }).response?.status
    toast.error(status === 409
      ? 'Ya existe un adolescente con esa cédula.'
      : 'No se pudo guardar. Intenta nuevamente.')
  }
}

async function handleDeactivate() {
  if (!selectedId.value) return
  try {
    await adolescenteService.remove(selectedId.value)
    await cargarAdolescentes()
    toast.success('Adolescente retirado; el historial se conserva.')
    modal.value = null
  } catch {
    toast.error('No se pudo retirar el adolescente. Intenta nuevamente.')
  }
}

function onSearchInput() { page.value = 1 }
function onFilterChange() { page.value = 1 }

const selectedRow = () => rows.value.find(a => a.id === selectedId.value)
</script>

<template>
  <!-- Hero -->
  <div class="hero">
    <p class="hero-eyebrow">Gestión</p>
    <div class="hero-row">
      <div>
        <h1>Adolescentes</h1>
        <p>Registro y seguimiento de adolescentes con medidas socioeducativas no privativas de libertad</p>
      </div>
    </div>
  </div>

  <!-- Toolbar -->
  <div class="toolbar">
    <div class="tool-search">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <input v-model="search" placeholder="Buscar por nombre o cédula…" @input="onSearchInput" />
    </div>
    <select class="tool-select" v-model="filterNacionalidad" @change="onFilterChange">
      <option value="Todas">Nacionalidad: Todas</option>
      <option v-for="n in nacionalidades" :key="n.id" :value="n.nombre">{{ n.nombre }}</option>
    </select>
    <div class="spacer" />
    <button v-if="puedeCrear" class="btn btn-primary" type="button" @click="openNew">
      <UserPlus :size="17" />
      Nuevo adolescente
    </button>
  </div>

  <!-- Tabla -->
  <div class="tbl-card">
    <table class="tbl">
      <thead>
        <tr>
          <th>ID</th>
          <th>Adolescente</th>
          <th>Cédula</th>
          <th>Edad</th>
          <th>Nacionalidad</th>
          <th>Ingreso</th>
          <th style="text-align:right;">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="a in paged" :key="a.id">
          <td class="td-id">#{{ a.id }}</td>
          <td>
            <div class="td-name">
              <b>{{ a.nombre }}</b>
              <span>{{ a.canton }}</span>
            </div>
          </td>
          <td><span class="pill">{{ a.ced }}</span></td>
          <td>{{ a.edad }} años</td>
          <td>{{ a.nacionalidad }}</td>
          <td>{{ a.ingreso }}</td>
          <td class="td-actions">
            <div class="row">
              <button v-if="puedeVerExpedientes" class="ico-btn" type="button" title="Ver expedientes" @click="router.push('/app/expedientes')">
                <Eye :size="16" />
              </button>
              <button v-if="puedeEditar" class="ico-btn" type="button" title="Editar" @click="openEdit(a.id)">
                <Pencil :size="16" />
              </button>
              <button v-if="puedeRetirar" class="ico-btn danger" type="button" title="Retirar adolescente" @click="openDeactivate(a.id)">
                <Ban :size="16" />
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="paged.length === 0">
          <td colspan="7" style="text-align:center;padding:32px;color:var(--color-text-muted);">Sin resultados para los filtros aplicados</td>
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

  <!-- Modal crear / editar -->
  <div v-if="modal === 'new' || modal === 'edit'" class="backdrop">
    <div class="modal lg">
      <div class="modal-head">
        <div>
          <p class="eyebrow">Gestión · Adolescentes</p>
          <h3>{{ modal === 'new' ? 'Registrar nuevo adolescente' : `Editar adolescente · #${selectedId}` }}</h3>
        </div>
        <button class="x" type="button" @click="modal = null">
          <X :size="18" />
        </button>
      </div>
      <div class="modal-body">
        <div class="fsec">
          <div class="fsec-title">Datos personales</div>
          <div class="frow c3">
            <div class="f">
              <div class="f-label">Cédula de identidad <span class="req">*</span></div>
              <input class="f-ctl" v-model="form.ced" placeholder="0000000000" maxlength="20" />
            </div>
            <div class="f">
              <div class="f-label">Nombres <span class="req">*</span></div>
              <input class="f-ctl" v-model="form.nombre" placeholder="Nombres" />
            </div>
            <div class="f">
              <div class="f-label">Apellidos <span class="req">*</span></div>
              <input class="f-ctl" v-model="form.apellido" placeholder="Apellidos" />
            </div>
          </div>
          <div class="frow c3" style="margin-top:16px;">
            <div class="f">
              <div class="f-label">Fecha de nacimiento <span class="req">*</span></div>
              <input class="f-ctl" type="date" v-model="form.fecha_nac" />
            </div>
            <div class="f">
              <div class="f-label">Sexo <span class="req">*</span></div>
              <select class="f-ctl" v-model="form.sexo">
                <option value="">Seleccione…</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="O">Otro</option>
              </select>
            </div>
            <div class="f">
              <div class="f-label">Fecha de ingreso <span class="req">*</span></div>
              <input class="f-ctl" type="date" v-model="form.fecha_ingr" />
            </div>
          </div>
          <div class="frow c3" style="margin-top:16px;">
            <div class="f">
              <div class="f-label">Nacionalidad <span class="req">*</span></div>
              <select class="f-ctl" v-model.number="form.nacn_id">
                <option :value="0">Seleccione…</option>
                <option v-for="n in nacionalidades" :key="n.id" :value="n.id">{{ n.nombre }}</option>
              </select>
            </div>
            <div class="f">
              <div class="f-label">Estado civil <span class="req">*</span></div>
              <select class="f-ctl" v-model.number="form.etcv_id">
                <option :value="0">Seleccione…</option>
                <option v-for="e in estadosCiviles" :key="e.id" :value="e.id">{{ e.nombre }}</option>
              </select>
            </div>
            <div class="f">
              <div class="f-label">Etnia <span class="req">*</span></div>
              <select class="f-ctl" v-model.number="form.etna_id">
                <option :value="0">Seleccione…</option>
                <option v-for="e in etnias" :key="e.id" :value="e.id">{{ e.nombre }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="fsec">
          <div class="fsec-title">Ubicación y contexto</div>
          <div class="frow c3">
            <div class="f">
              <div class="f-label">Provincia <span class="req">*</span></div>
              <select class="f-ctl" v-model.number="form.provincia_id" @change="onProvinciaChange">
                <option :value="0">Seleccione…</option>
                <option v-for="p in provincias" :key="p.id" :value="p.id">{{ p.nombre }}</option>
              </select>
            </div>
            <div class="f">
              <div class="f-label">Cantón <span class="req">*</span></div>
              <select class="f-ctl" v-model.number="form.cntn_id" :disabled="!form.provincia_id">
                <option :value="0">{{ form.provincia_id ? 'Seleccione…' : 'Elija una provincia' }}</option>
                <option v-for="c in cantonesFiltrados" :key="c.id" :value="c.id">{{ c.nombre }}</option>
              </select>
            </div>
            <div class="f">
              <div class="f-label">Grupo Delictivo Organizado (GDO)</div>
              <select class="f-ctl" v-model.number="form.gdo_id">
                <option :value="0">Sin vinculación</option>
                <option v-for="g in gdos" :key="g.id" :value="g.id">{{ g.nombre }}</option>
              </select>
            </div>
          </div>
          <div class="frow c3" style="margin-top:16px;align-items:center;">
            <div class="f">
              <div class="f-label">N.º de hijos</div>
              <input class="f-ctl" type="number" min="0" v-model.number="form.hijos" />
            </div>
            <div class="f">
              <div class="f-label">Centro educativo</div>
              <input class="f-ctl" v-model="form.nved_nombre" placeholder="Nombre de la institución…" />
            </div>
            <div class="f" style="display:flex;gap:18px;align-items:center;padding-top:24px;">
              <label class="chk">
                <input type="checkbox" v-model="form.reincide" /> Reincidente
              </label>
              <label class="chk">
                <input type="checkbox" v-model="form.hijoPpl" /> Hijo de PPL
              </label>
            </div>
          </div>
          <div class="frow" style="margin-top:16px;">
            <div class="f" style="grid-column:1/-1;">
              <div class="f-label">Observaciones</div>
              <textarea class="f-ctl area" v-model="form.obs" placeholder="Información adicional relevante para el expediente…"></textarea>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" type="button" @click="modal = null">
          <X :size="15" /> Cancelar
        </button>
        <button class="btn btn-primary" type="button" :disabled="!formValido" @click="handleSave">
          <Save :size="15" />
          {{ modal === 'new' ? 'Guardar registro' : 'Actualizar' }}
        </button>
      </div>
    </div>
  </div>

  <!-- Modal retirar adolescente -->
  <div v-if="modal === 'deactivate'" class="backdrop">
    <div class="modal sm">
      <div class="modal-head">
        <h3>Retirar adolescente</h3>
        <button class="x" type="button" @click="modal = null">
          <X :size="18" />
        </button>
      </div>
      <div class="modal-body">
        <div class="confirm">
          <div class="confirm-ico">
            <Ban :size="30" />
          </div>
          <h3>¿Retirar este adolescente?</h3>
          <p>Dejará de ofrecerse en nuevos registros; sus expedientes e historial se conservan y pueden consultarse.</p>
          <span v-if="selectedRow()" class="name">{{ selectedRow()!.nombre }} · #{{ selectedId }}</span>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn btn-ghost" type="button" @click="modal = null">
          <X :size="15" /> Cancelar
        </button>
        <button class="btn btn-danger-solid" type="button" @click="handleDeactivate">
          <Ban :size="15" /> Retirar adolescente
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chk {
  display: flex; align-items: center; gap: 8px;
  font-size: .85rem; font-weight: 600; color: var(--color-text-secondary);
  cursor: pointer; padding-top: 18px;
}
.chk input { width: 16px; height: 16px; cursor: pointer; }
</style>
