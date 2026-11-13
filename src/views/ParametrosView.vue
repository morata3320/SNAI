<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Building2, Shield, Bell, Save, CheckCircle2 } from '@lucide/vue'
import { useAuth } from '../composables/useAuth'
import { uzdiService } from '../services/uzdi.service'
import {
  guardarNotificaciones,
  guardarSeguridad,
  leerNotificaciones,
  leerSeguridad,
  NOTIFICACIONES_DEFAULT,
  SEGURIDAD_DEFAULT,
  type ParametrosNotificaciones,
  type ParametrosSeguridad,
} from '../config/seguridad'
import api from '../services/api'

interface ParametrosApi {
  seguridad?: Partial<ParametrosSeguridad>
  notificaciones?: Partial<ParametrosNotificaciones>
  organizacion?: { nombre?: string; siglas?: string }
}

const { user } = useAuth()
const savedSection  = ref<string | null>(null)
const savingSection = ref<string | null>(null)
const loadingOrg    = ref(true)
const orgError      = ref('')
const paramsError   = ref('')
const uzdiId        = ref<number | null>(null)

const org = ref({ nombre: '', zona: '', direccion: '', telefono: '', correo: '' })
const seg = ref<ParametrosSeguridad>({ ...leerSeguridad() })
const notif = ref<ParametrosNotificaciones>({ ...leerNotificaciones() })

function guardarLocal() {
  guardarSeguridad(seg.value)
  guardarNotificaciones(notif.value)
}

onMounted(async () => {
  const uid = user.value?.['uzdi_id'] as number | undefined
  if (!uid) { loadingOrg.value = false; orgError.value = 'El usuario no tiene UZDI asignada.'; return }
  uzdiId.value = uid

  const [parametros, uzdi] = await Promise.allSettled([
    api.get<ParametrosApi>('/parametros'),
    uzdiService.getById(uid),
  ])

  if (parametros.status === 'fulfilled') {
    seg.value = { ...SEGURIDAD_DEFAULT, ...(parametros.value.data.seguridad ?? {}) }
    notif.value = { ...NOTIFICACIONES_DEFAULT, ...(parametros.value.data.notificaciones ?? {}) }
    guardarLocal()
  } else {
    paramsError.value = 'No se pudieron cargar los parámetros del servidor; se muestran los últimos valores guardados.'
  }

  if (uzdi.status === 'fulfilled') {
    const data = uzdi.value
    org.value = {
      nombre:    data.nombre    ?? '',
      zona:      data.zona      ?? '',
      direccion: data.direccion ?? '',
      telefono:  data.telefono  ?? '',
      correo:    data.correo    ?? '',
    }
  } else {
    orgError.value = 'No se pudieron cargar los datos de la UZDI.'
  }
  loadingOrg.value = false
})

async function save(section: string) {
  savingSection.value = section
  orgError.value = ''
  paramsError.value = ''
  try {
    if (section === 'org' && uzdiId.value) {
      await uzdiService.update(uzdiId.value, { ...org.value })
    } else if (section === 'seg') {
      await api.patch('/parametros', { seguridad: { ...seg.value } })
      guardarLocal()
    } else if (section === 'notif') {
      await api.patch('/parametros', { notificaciones: { ...notif.value } })
      guardarLocal()
    }
    savedSection.value = section
    setTimeout(() => { savedSection.value = null }, 2800)
  } catch {
    const mensaje = 'No se pudieron guardar los cambios. Verifique los datos e intente nuevamente.'
    if (section === 'org') orgError.value = mensaje
    else paramsError.value = mensaje
  } finally {
    savingSection.value = null
  }
}
</script>

<template>
  <div class="page">
    <div class="hero">
      <div class="hero-content">
        <p class="hero-eyebrow">Configuración</p>
        <h1 class="hero-title">Parámetros del sistema</h1>
        <p class="hero-desc">Configuración general de la unidad UZDI.</p>
      </div>
    </div>

    <div class="params-grid">

      <!-- Organización -->
      <div class="card">
        <div class="param-card-hd">
          <div class="param-card-ico"><Building2 :size="18" /></div>
          <div>
            <h2 class="param-card-title">Organización</h2>
            <p class="param-card-sub">Datos institucionales de la unidad</p>
          </div>
        </div>

        <div v-if="savedSection === 'org'" class="param-ok">
          <CheckCircle2 :size="15" /> Cambios guardados correctamente.
        </div>
        <div v-if="orgError && !loadingOrg" class="param-err" role="alert">{{ orgError }}</div>
        <p class="param-demo">Datos de la UZDI de demostración.</p>

        <div v-if="loadingOrg" style="padding:16px 0;color:var(--color-text-muted);font-size:13.5px;">
          Cargando datos de la unidad…
        </div>
        <form v-else @submit.prevent="save('org')" class="param-form">
          <div>
            <label class="f-label">Nombre de la unidad</label>
            <input v-model="org.nombre" class="f-ctl" />
          </div>
          <div>
            <label class="f-label">Zona</label>
            <input v-model="org.zona" class="f-ctl" placeholder="Ej. Zona 9" />
          </div>
          <div>
            <label class="f-label">Teléfono</label>
            <input v-model="org.telefono" class="f-ctl" />
          </div>
          <div>
            <label class="f-label">Dirección</label>
            <input v-model="org.direccion" class="f-ctl" />
          </div>
          <div>
            <label class="f-label">Correo institucional</label>
            <input v-model="org.correo" type="email" class="f-ctl" />
          </div>
          <div class="param-foot">
            <button type="submit" class="btn btn-primary btn-sm" :disabled="savingSection === 'org'">
              <Save :size="14" /> {{ savingSection === 'org' ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Seguridad -->
      <div class="card">
        <div class="param-card-hd">
          <div class="param-card-ico"><Shield :size="18" /></div>
          <div>
            <h2 class="param-card-title">Seguridad</h2>
            <p class="param-card-sub">Políticas de acceso y contraseñas</p>
          </div>
        </div>

        <div v-if="savedSection === 'seg'" class="param-ok">
          <CheckCircle2 :size="15" /> Cambios guardados correctamente.
        </div>
        <div v-if="paramsError" class="param-err" role="alert">{{ paramsError }}</div>
        <p class="param-demo">Valores de demostración — definitivos por acordar con el SNAI.</p>

        <form @submit.prevent="save('seg')" class="param-form">
          <div>
            <label class="f-label" for="param-inactividad">Tiempo de sesión inactiva (minutos)</label>
            <input id="param-inactividad" v-model.number="seg.sesionTimeout" type="number" min="5" max="120" class="f-ctl" />
          </div>
          <div>
            <label class="f-label" for="param-intentos">Intentos de login antes de bloqueo</label>
            <input id="param-intentos" v-model.number="seg.intentosMaximos" type="number" min="1" max="10" class="f-ctl" />
          </div>
          <div>
            <label class="f-label" for="param-bloqueo">Duración del bloqueo (minutos)</label>
            <input id="param-bloqueo" v-model.number="seg.duracionBloqueoMin" type="number" min="1" max="60" class="f-ctl" />
          </div>
          <div>
            <label class="f-label" for="param-caducidad">Caducidad de contraseña (días)</label>
            <input id="param-caducidad" v-model.number="seg.cambioPassDias" type="number" min="30" max="365" class="f-ctl" />
          </div>
          <div class="param-foot">
            <button type="submit" class="btn btn-primary btn-sm" :disabled="savingSection === 'seg'">
              <Save :size="14" /> {{ savingSection === 'seg' ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Notificaciones -->
      <div class="card">
        <div class="param-card-hd">
          <div class="param-card-ico"><Bell :size="18" /></div>
          <div>
            <h2 class="param-card-title">Notificaciones</h2>
            <p class="param-card-sub">Alertas automáticas por vencimiento</p>
          </div>
        </div>

        <div v-if="savedSection === 'notif'" class="param-ok">
          <CheckCircle2 :size="15" /> Cambios guardados correctamente.
        </div>
        <div v-if="paramsError" class="param-err" role="alert">{{ paramsError }}</div>
        <p class="param-demo">Valores de demostración — definitivos por acordar con el SNAI.</p>

        <form @submit.prevent="save('notif')" class="param-form">
          <div>
            <label class="f-label" for="param-dias-alerta">Días de anticipación para alertar vencimientos</label>
            <input id="param-dias-alerta" v-model.number="notif.diasAnticipacionVencimiento" type="number" min="1" max="30" class="f-ctl" />
          </div>
          <div>
            <label class="f-label" for="param-correo-alertas">Correo destinatario de alertas</label>
            <input id="param-correo-alertas" v-model="notif.correoAlertas" type="email" class="f-ctl" placeholder="correo@uzdi.gob.ec" />
          </div>
          <div class="param-toggle-row">
            <label class="f-label" style="margin:0">Alertas por correo electrónico</label>
            <label class="toggle">
              <input v-model="notif.emailActivo" type="checkbox" />
              <span class="toggle-track" />
            </label>
          </div>
          <div class="param-foot">
            <button type="submit" class="btn btn-primary btn-sm" :disabled="savingSection === 'notif'">
              <Save :size="14" /> {{ savingSection === 'notif' ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>

    </div>
  </div>
</template>

<style scoped>
.params-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  padding: 0 0 24px;
  align-items: start;
}

.params-grid > .card { padding: 20px; }

.param-card-hd {
  display: flex; align-items: flex-start; gap: 12px;
  margin-bottom: 20px;
}

.param-card-ico {
  width: 38px; height: 38px; border-radius: var(--radius-md);
  background: var(--color-surface-mute);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-brand-blue);
  flex-shrink: 0;
}

.param-card-title { font-size: 14.5px; font-weight: 600; margin: 0 0 2px; color: var(--color-text-primary); }
.param-card-sub   { font-size: 12.5px; color: var(--color-text-muted); margin: 0; }

.param-demo {
  font-size: 12px;
  color: var(--color-text-muted);
  background: var(--color-surface-mute);
  border-radius: var(--radius-md);
  padding: 7px 10px;
  margin: 0 0 14px;
}

.param-form { display: flex; flex-direction: column; gap: 14px; }

.param-foot { display: flex; justify-content: flex-end; padding-top: 4px; }

.param-ok {
  display: flex; align-items: center; gap: 6px;
  background: var(--color-success-bg);
  color: var(--color-success);
  border: 1px solid var(--color-success-border);
  border-radius: var(--radius-md);
  padding: 9px 14px; font-size: 13.5px;
  margin-bottom: 16px;
}

.param-err {
  background: var(--color-error-bg);
  color: var(--color-error);
  border: 1px solid var(--color-error-border);
  border-radius: var(--radius-md);
  padding: 9px 14px; font-size: 13.5px;
  margin-bottom: 16px;
}

.param-toggle-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 4px 0;
}

.toggle { position: relative; display: inline-flex; cursor: pointer; }
.toggle input { position: absolute; opacity: 0; width: 0; height: 0; }

.toggle-track {
  width: 40px; height: 22px;
  background: var(--color-border);
  border-radius: var(--radius-full, 9999px);
  transition: background 0.2s ease;
  position: relative;
}

.toggle-track::after {
  content: '';
  position: absolute;
  top: 3px; left: 3px;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,.18);
  transition: transform 0.2s ease;
}

.toggle input:checked + .toggle-track { background: var(--color-brand-blue-light); }
.toggle input:checked + .toggle-track::after { transform: translateX(18px); }

@media (max-width: 768px) {
  .params-grid { grid-template-columns: 1fr; padding: 16px; }
}
</style>
