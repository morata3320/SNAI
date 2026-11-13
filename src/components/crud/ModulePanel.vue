<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { Ban, FilePlus2, Pencil } from '@lucide/vue'
import DataTable from '../ui/DataTable.vue'
import FormField from '../ui/FormField.vue'
import ModalForm from '../ui/ModalForm.vue'
import ConfirmModal from '../ui/ConfirmModal.vue'
import { createCrudService } from '../../services/crud.service'
import { useCrud } from '../../composables/useCrud'
import { usePermisos } from '../../composables/usePermisos'
import { opcionesDe, type Opcion } from '../../composables/useReferencias'
import { useToast } from '../../composables/useToast'
import { validarCampo, type CampoDef, type ModuloDef, type Registro } from '../../entities/registry'

const props = defineProps<{ def: ModuloDef }>()

const toast = useToast()
const { puede } = usePermisos()

const service = createCrudService<Registro, Record<string, unknown>>(props.def.path)

function vacio(campo: CampoDef): unknown {
  if (campo.type === 'checkbox') return false
  return ''
}

function formularioVacio(): Record<string, unknown> {
  return Object.fromEntries(props.def.fields.map((campo) => [campo.key, vacio(campo)]))
}

function aFormulario(row: Registro): Record<string, unknown> {
  return Object.fromEntries(
    props.def.fields.map((campo) => [campo.key, row[campo.key] ?? vacio(campo)]),
  )
}

const {
  cargando, error, search, page, pageSize, filtered, paged,
  modal, form, guardando,
  recargar, onSearchInput, openNew, openEdit, openDeactivate, cerrar, guardar, desactivar,
} = useCrud<Registro, Record<string, unknown>>(service, {
  searchKeys: props.def.searchKeys as (keyof Registro)[],
  emptyForm: formularioVacio,
  toForm: aFormulario,
  nombre: (row) => props.def.columns[0]?.value(row) ?? `#${row.id}`,
  etiqueta: props.def.singular,
})

const errores = reactive<Record<string, string>>({})

const puedeCrear = computed(() => puede(props.def.id, 'create'))
const puedeEditar = computed(() => puede(props.def.id, 'edit'))
const puedeBaja = computed(() => puede(props.def.id, 'deactivate'))
const conAcciones = computed(() => puedeEditar.value || puedeBaja.value)

const columnas = computed(() => {
  const base = props.def.columns.map((col) => ({
    key: col.key,
    label: col.label,
    align: col.align,
    width: col.width,
  }))
  return conAcciones.value
    ? [...base, { key: 'acciones', label: 'Acciones', align: 'right' as const, width: '110px' }]
    : base
})

const opciones = reactive<Record<string, Opcion[]>>({})

async function cargarOpciones(): Promise<void> {
  const fuentes = [...new Set(props.def.fields.map((campo) => campo.ref).filter(Boolean))]
  for (const fuente of fuentes) {
    opciones[fuente as string] = await opcionesDe(fuente as Parameters<typeof opcionesDe>[0])
  }
}

onMounted(async () => {
  await Promise.all([recargar(), cargarOpciones()])
})

function limpiarErrores(): void {
  for (const key of Object.keys(errores)) delete errores[key]
}

function abrirNuevo(): void {
  limpiarErrores()
  openNew()
}

function abrirEditar(row: Registro): void {
  limpiarErrores()
  openEdit(row)
}

function abrirBaja(row: Registro): void {
  limpiarErrores()
  openDeactivate(row)
}

function escribir(key: string, evento: Event): void {
  const control = evento.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  form.value[key] = control.value
  delete errores[key]
}

function elegirReferencia(key: string, evento: Event): void {
  const control = evento.target as HTMLSelectElement
  form.value[key] = control.value === '' ? '' : Number(control.value)
  delete errores[key]
}

function marcar(key: string, evento: Event): void {
  const control = evento.target as HTMLInputElement
  form.value[key] = control.checked
}

function valorTexto(key: string): string {
  const valor = form.value[key]
  return valor === null || valor === undefined ? '' : String(valor)
}

async function guardarFormulario(): Promise<void> {
  limpiarErrores()
  for (const campo of props.def.fields) {
    const mensaje = validarCampo(campo, form.value[campo.key], form.value)
    if (mensaje) errores[campo.key] = mensaje
  }
  if (Object.keys(errores).length) {
    toast.error('Revise los campos marcados antes de guardar.')
    return
  }
  await guardar()
}
</script>

<template>
  <div v-if="def.aviso" class="aviso" role="note">
    {{ def.aviso }}
  </div>

  <div class="toolbar">
    <div v-if="def.searchKeys.length" class="tool-search">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <input v-model="search" :placeholder="`Buscar en ${def.title.toLowerCase()}…`" aria-label="Buscar" @input="onSearchInput" />
    </div>
    <div class="spacer" />
    <button v-if="puedeCrear" class="btn btn-primary" type="button" @click="abrirNuevo">
      <FilePlus2 :size="17" />
      Nuevo registro
    </button>
  </div>

  <DataTable
    :columns="columnas"
    :rows="paged"
    :total="filtered.length"
    :page="page"
    :page-size="pageSize"
    :cargando="cargando"
    :error="error"
    empty-title="Sin registros"
    :empty-message="`Aún no hay ${def.title.toLowerCase()} para los filtros aplicados.`"
    @update:page="page = $event"
    @retry="recargar"
  >
    <template #row="{ row }">
      <td
        v-for="col in def.columns"
        :key="col.key"
        :style="{ textAlign: col.align ?? 'left', width: col.width }"
      >
        <span v-if="col.badge" class="badge" :class="col.badge(row)">{{ col.value(row) }}</span>
        <template v-else>{{ col.value(row) }}</template>
      </td>
      <td v-if="conAcciones" class="td-actions">
        <div class="row">
          <button
            v-if="puedeEditar"
            class="ico-btn"
            type="button"
            :title="`Editar ${def.singular}`"
            :aria-label="`Editar ${def.singular}`"
            @click="abrirEditar(row)"
          >
            <Pencil :size="16" />
          </button>
          <button
            v-if="puedeBaja && row.activo !== false"
            class="ico-btn danger"
            type="button"
            :title="def.bajaLabel ?? 'Desactivar'"
            :aria-label="def.bajaLabel ?? 'Desactivar'"
            @click="abrirBaja(row)"
          >
            <Ban :size="16" />
          </button>
        </div>
      </td>
    </template>
  </DataTable>

  <ModalForm
    :show="modal === 'new' || modal === 'edit'"
    :title="modal === 'new' ? `Registrar ${def.singular}` : `Editar ${def.singular}`"
    :eyebrow="def.title"
    size="lg"
    :saving="guardando"
    :save-label="modal === 'new' ? 'Guardar registro' : 'Guardar cambios'"
    @close="cerrar"
    @save="guardarFormulario"
  >
    <div class="fsec">
      <div class="fsec-title">Datos del registro</div>
      <div class="frow">
        <FormField
          v-for="campo in def.fields"
          :key="campo.key"
          :label="campo.label"
          :required="campo.required"
          :error="errores[campo.key]"
          :hint="campo.hint"
          :style="campo.ancho === 'full' ? 'grid-column:1/-1' : undefined"
        >
          <template #default="{ id, describedby, invalid }">
            <textarea
              v-if="campo.type === 'textarea'"
              :id="id"
              class="f-ctl"
              rows="3"
              :value="valorTexto(campo.key)"
              :placeholder="campo.placeholder"
              :aria-describedby="describedby"
              :aria-invalid="invalid || undefined"
              @input="escribir(campo.key, $event)"
            />
            <select
              v-else-if="campo.type === 'select'"
              :id="id"
              class="f-ctl"
              :value="valorTexto(campo.key)"
              :aria-describedby="describedby"
              :aria-invalid="invalid || undefined"
              @change="escribir(campo.key, $event)"
            >
              <option value="" disabled>Seleccione…</option>
              <option v-for="opcion in campo.options" :key="opcion" :value="opcion">{{ opcion }}</option>
            </select>
            <select
              v-else-if="campo.type === 'ref'"
              :id="id"
              class="f-ctl"
              :value="valorTexto(campo.key)"
              :aria-describedby="describedby"
              :aria-invalid="invalid || undefined"
              @change="elegirReferencia(campo.key, $event)"
            >
              <option value="" disabled>Seleccione…</option>
              <option v-for="opcion in opciones[campo.ref ?? ''] ?? []" :key="opcion.value" :value="opcion.value">
                {{ opcion.label }}
              </option>
            </select>
            <label v-else-if="campo.type === 'checkbox'" class="check-line" :for="id">
              <input
                :id="id"
                type="checkbox"
                :checked="!!form[campo.key]"
                :aria-describedby="describedby"
                @change="marcar(campo.key, $event)"
              />
              <span>{{ campo.hint ?? 'Sí' }}</span>
            </label>
            <input
              v-else
              :id="id"
              class="f-ctl"
              :type="campo.type ?? 'text'"
              :value="valorTexto(campo.key)"
              :placeholder="campo.placeholder"
              :aria-describedby="describedby"
              :aria-invalid="invalid || undefined"
              :min="campo.type === 'number' ? 1 : undefined"
              @input="escribir(campo.key, $event)"
            />
          </template>
        </FormField>
      </div>
    </div>
  </ModalForm>

  <ConfirmModal
    :show="modal === 'delete'"
    :title="def.bajaLabel ?? 'Desactivar registro'"
    :message="def.bajaAviso ?? 'El registro dejará de ofrecerse en nuevos registros; el historial se conserva.'"
    :confirm-label="def.bajaLabel ?? 'Desactivar'"
    variant="warn"
    @cancel="cerrar"
    @confirm="desactivar()"
  />
</template>

<style scoped>
.aviso {
  margin-bottom: 14px;
  padding: 11px 14px;
  border: 1px solid var(--color-warning-border);
  border-left: 4px solid var(--color-warning);
  border-radius: var(--radius-md);
  background: var(--color-warning-bg);
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}
.check-line {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  font-size: 13.5px;
  color: var(--color-text-secondary);
}
</style>
