<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Lock, Save, ShieldCheck } from '@lucide/vue'
import api from '../services/api'
import { useToast } from '../composables/useToast'
import { usePermisos } from '../composables/usePermisos'
import { NAV_GROUPS } from '../router/nav'
import {
  ROLE_LABEL,
  defaultPermissions,
  type Action,
  type ModuleId,
  type RolePermissions,
} from '../router/access'
import ConfirmModal from '../components/ui/ConfirmModal.vue'
import { ENDPOINTS, USE_MOCK } from '../services/backend-contract'
import { listaDe } from '../services/response'

const toast = useToast()
const { puede } = usePermisos()

const ROLES = [4, 3, 2, 1, 6, 7, 8]
const ACCIONES: { key: Action; label: string }[] = [
  { key: 'view', label: 'Ver' },
  { key: 'create', label: 'Crear' },
  { key: 'edit', label: 'Editar' },
  { key: 'deactivate', label: 'Desactivar' },
]

const MODULOS = NAV_GROUPS.flatMap((grupo) => grupo.items)
const seleccion = ref(2)
const matriz = ref<RolePermissions>({})
const cargando = ref(false)
const guardando = ref(false)
const confirmar = ref(false)
const reglasBackend = ref<number | null>(null)

const editable = computed(() => USE_MOCK && puede('permisos', 'edit'))

function normalizar(datos: RolePermissions): RolePermissions {
  const copia: RolePermissions = {}
  for (const modulo of MODULOS) {
    copia[modulo.id] = [...(datos[modulo.id] ?? [])]
  }
  return copia
}

async function cargarRol(): Promise<void> {
  cargando.value = true
  try {
    if (!USE_MOCK) {
      matriz.value = normalizar(defaultPermissions(seleccion.value))
      if (reglasBackend.value === null) {
        try {
          const { data } = await api.get<unknown>(ENDPOINTS.permiso)
          reglasBackend.value = listaDe<Record<string, unknown>>(data).length
        } catch {
          reglasBackend.value = -1
        }
      }
      return
    }
    const { data } = await api.get<RolePermissions>(`/permisos/${seleccion.value}`)
    matriz.value = normalizar(data)
  } catch {
    matriz.value = normalizar(defaultPermissions(seleccion.value))
    toast.error('No se pudo cargar la matriz del perfil; se muestra la configuración por defecto.')
  } finally {
    cargando.value = false
  }
}

onMounted(cargarRol)

function tiene(modulo: ModuleId, accion: Action): boolean {
  return matriz.value[modulo]?.includes(accion) ?? false
}

function cambiar(modulo: ModuleId, accion: Action, evento: Event): void {
  if (!editable.value) return
  const marcado = (evento.target as HTMLInputElement).checked
  const acciones = new Set(matriz.value[modulo] ?? [])
  if (accion === 'view' && !marcado) {
    acciones.clear()
  } else {
    acciones.add(accion)
    if (accion !== 'view' && marcado) acciones.add('view')
  }
  matriz.value[modulo] = [...acciones]
}

async function guardar(): Promise<void> {
  if (!USE_MOCK) {
    toast.info('El OpenAPI no documenta cómo convertir /permiso a una matriz editable por perfil.')
    return
  }
  guardando.value = true
  try {
    await api.put(`/permisos/${seleccion.value}`, matriz.value)
    toast.success('Matriz de permisos actualizada. Se aplicará en el siguiente ingreso.')
    confirmar.value = false
  } catch {
    toast.error('No se pudo guardar la matriz de permisos. Intente nuevamente.')
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div class="hero">
    <p class="hero-eyebrow">Configuración</p>
    <div class="hero-row">
      <div>
        <h1>Permisos por perfil</h1>
        <p>Matriz de módulos y acciones por rol.</p>
      </div>
      <button
        v-if="editable"
        class="btn btn-primary"
        type="button"
        :disabled="cargando"
        @click="confirmar = true"
      >
        <Save :size="16" /> Guardar cambios
      </button>
    </div>
  </div>

  <div class="notice" role="note">
    <Lock :size="16" />
    <span v-if="USE_MOCK">Los cambios se aplican en el siguiente ingreso de los usuarios del perfil. Quedan registrados en la bitácora.</span>
    <span v-else>
      Referencia de permisos del frontend. El backend publica /permiso, pero Swagger no documenta sus campos;
      la edición queda deshabilitada para no inventar el contrato.
      <template v-if="reglasBackend !== null && reglasBackend >= 0"> Se recibieron {{ reglasBackend }} reglas del servidor.</template>
      <template v-else-if="reglasBackend === -1"> El perfil actual no pudo consultar esas reglas.</template>
    </span>
  </div>

  <div class="permisos-grid">
    <div class="perfiles card">
      <h2 class="card-title">Perfiles</h2>
      <button
        v-for="rol in ROLES"
        :key="rol"
        class="perfil-btn"
        :class="{ 'is-active': seleccion === rol }"
        type="button"
        @click="seleccion = rol; cargarRol()"
      >
        <span>{{ ROLE_LABEL[rol] }}</span>
        <span class="perfil-id">#{{ rol }}</span>
      </button>
    </div>

    <div class="matriz card">
      <div class="matriz-head">
        <div>
          <h2 class="card-title">{{ ROLE_LABEL[seleccion] }}</h2>
          <p class="card-sub">Marque las acciones permitidas para cada módulo.</p>
        </div>
        <span v-if="!editable" class="badge slate"><ShieldCheck :size="13" /> Solo consulta</span>
      </div>

      <div v-if="cargando" class="cargando">Cargando matriz de permisos…</div>
      <div v-else class="rbac-wrap">
        <table class="rbac">
          <thead>
            <tr>
              <th scope="col">Módulo</th>
              <th v-for="accion in ACCIONES" :key="accion.key" scope="col">{{ accion.label }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="modulo in MODULOS" :key="modulo.id">
              <th scope="row">{{ modulo.label }}</th>
              <td v-for="accion in ACCIONES" :key="accion.key">
                <input
                  type="checkbox"
                  :checked="tiene(modulo.id, accion.key)"
                  :disabled="!editable || cargando"
                  :aria-label="`${accion.label} ${modulo.label}`"
                  @change="cambiar(modulo.id, accion.key, $event)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <ConfirmModal
    :show="confirmar"
    title="Guardar cambios de permisos"
    :message="`Se actualizará la matriz del perfil ${ROLE_LABEL[seleccion]}. Los usuarios verán los cambios en su siguiente ingreso.`"
    confirm-label="Guardar matriz"
    variant="warn"
    @cancel="confirmar = false"
    @confirm="guardar"
  />
</template>

<style scoped>
.notice {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin-bottom: 16px;
  padding: 11px 14px;
  border-left: 4px solid var(--color-brand-blue);
  border-radius: var(--radius-md);
  background: var(--color-info-bg);
  color: var(--color-text-secondary);
  font-size: 13px;
  line-height: 1.5;
}
.permisos-grid {
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.card {
  padding: 16px;
}
.card-title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-primary);
}
.card-sub {
  margin: 3px 0 0;
  font-size: 12.5px;
  color: var(--color-text-muted);
}
.perfiles {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.perfiles .card-title { margin-bottom: 8px; }
.perfil-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 9px 10px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-secondary);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}
.perfil-btn:hover { background: var(--color-surface-soft); }
.perfil-btn.is-active {
  background: var(--color-info-bg);
  border-color: var(--color-info-border);
  color: var(--color-brand-blue);
  font-weight: 600;
}
.perfil-id { color: var(--color-text-muted); font-size: 11.5px; }
.matriz { padding: 16px; }
.matriz-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.cargando {
  padding: 24px 4px;
  color: var(--color-text-muted);
  font-size: 13px;
}
.rbac-wrap { overflow-x: auto; }
.rbac {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.rbac th, .rbac td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}
.rbac thead th {
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: var(--color-text-muted);
  white-space: nowrap;
}
.rbac tbody th {
  font-weight: 500;
  color: var(--color-text-secondary);
  white-space: nowrap;
}
.rbac td { text-align: center; width: 92px; }
.rbac input[type="checkbox"] { width: 16px; height: 16px; accent-color: var(--color-brand-blue); }
@media (max-width: 780px) {
  .permisos-grid { grid-template-columns: 1fr; }
}
</style>
