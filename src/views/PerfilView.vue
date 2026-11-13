<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { User, Mail, Phone, Lock, Save, Edit2, X, IdCard, Building2, ShieldCheck } from '@lucide/vue'
import { useAuth } from '../composables/useAuth'
import { usuarioService } from '../services/usuario.service'
import { catalogoService, type UzdiItem } from '../services/catalogo.service'
import { validarEmail, validarTelefonoEC } from '../utils/validators'
import api from '../services/api'
import { ENDPOINTS } from '../services/backend-contract'

const { user, token, setSession } = useAuth()
const u = computed(() => (user.value ?? {}) as Record<string, unknown>)
const uzdis = ref<UzdiItem[]>([])

const editing = ref(false)
const savingProfile = ref(false)
const profileSuccess = ref(false)
const profileError = ref('')
const savingPassword = ref(false)
const passwordSuccess = ref(false)

const profileForm = ref({ nombres: '', apellidos: '', correo: '', telefono: '' })
const passwordForm = ref({ actual: '', nueva: '', confirmar: '' })
const passwordErrors = ref({ actual: '', nueva: '', confirmar: '' })

const initials = computed(() =>
  `${String(u.value.nombres ?? '').charAt(0)}${String(u.value.apellidos ?? '').charAt(0)}`.toUpperCase() || 'US'
)

const roles = computed(() => {
  const lista = u.value.roles as { nombre?: string }[] | undefined
  return lista?.map(r => r.nombre).filter(Boolean).join(', ') || 'Sin rol asignado'
})

const uzdi = computed(() => {
  const id = Number(u.value.uzdi_id ?? 0)
  return uzdis.value.find(x => x.id === id)?.nombre ?? (id ? `UZDI #${id}` : 'Sin UZDI asignada')
})

onMounted(async () => {
  uzdis.value = await catalogoService.uzdis()
})

function startEdit() {
  profileForm.value = {
    nombres:   String(u.value.nombres   ?? ''),
    apellidos: String(u.value.apellidos ?? ''),
    correo:    String(u.value.correo    ?? ''),
    telefono:  String(u.value.telefono  ?? ''),
  }
  profileError.value = ''
  editing.value = true
}

function cancelEdit() { editing.value = false }

async function saveProfile() {
  profileError.value = ''
  if (!profileForm.value.nombres || !profileForm.value.apellidos) {
    profileError.value = 'Nombres y apellidos son obligatorios.'
    return
  }
  if (profileForm.value.correo && !validarEmail(profileForm.value.correo)) {
    profileError.value = 'Ingresa un correo electrónico válido.'
    return
  }
  if (profileForm.value.telefono && !validarTelefonoEC(profileForm.value.telefono)) {
    profileError.value = 'Ingresa un teléfono válido (09XXXXXXXX o 0XXXXXXXX).'
    return
  }
  savingProfile.value = true
  try {
    await usuarioService.update(u.value.id as number, profileForm.value)
    setSession(token.value, { ...user.value, ...profileForm.value } as Record<string, unknown>)
    editing.value = false
    profileSuccess.value = true
    setTimeout(() => { profileSuccess.value = false }, 3000)
  } catch {
    profileError.value = 'No se pudo guardar. Verifica que el backend esté activo.'
  } finally {
    savingProfile.value = false
  }
}

function validatePassword(): boolean {
  passwordErrors.value = { actual: '', nueva: '', confirmar: '' }
  let valid = true
  if (!passwordForm.value.actual) { passwordErrors.value.actual = 'Ingresa tu contraseña actual'; valid = false }
  if (passwordForm.value.nueva.length < 8) { passwordErrors.value.nueva = 'Mínimo 8 caracteres'; valid = false }
  if (passwordForm.value.nueva === passwordForm.value.actual) { passwordErrors.value.nueva = 'La nueva contraseña debe ser distinta de la actual'; valid = false }
  if (passwordForm.value.nueva !== passwordForm.value.confirmar) { passwordErrors.value.confirmar = 'Las contraseñas no coinciden'; valid = false }
  return valid
}

async function savePassword() {
  if (!validatePassword()) return
  savingPassword.value = true
  try {
    await api.post(ENDPOINTS.auth.changePassword, {
      userId:          u.value.id,
      currentPassword: passwordForm.value.actual,
      newPassword:     passwordForm.value.nueva,
    })
    passwordSuccess.value = true
    passwordForm.value = { actual: '', nueva: '', confirmar: '' }
    setTimeout(() => { passwordSuccess.value = false }, 3000)
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
    passwordErrors.value.actual = msg ?? 'Error al cambiar la contraseña'
  } finally {
    savingPassword.value = false
  }
}
</script>

<template>
  <div class="page">
    <div class="hero">
      <div class="hero-content">
        <p class="hero-eyebrow">Cuenta</p>
        <h1 class="hero-title">Mi perfil</h1>
        <p class="hero-desc">Información personal y configuración de acceso.</p>
      </div>
    </div>

    <div class="perfil-layout">

      <!-- Avatar card -->
      <div class="card perfil-avatar">
        <div class="avatar-circle">{{ initials }}</div>
        <p class="avatar-name">{{ u.nombres ?? '—' }} {{ u.apellidos ?? '' }}</p>
        <p class="avatar-login">{{ u.login ?? '—' }}</p>
        <span class="badge green" style="margin-top:8px">Activo</span>
        <p class="avatar-rol">{{ roles }}</p>
        <p class="avatar-rol">{{ uzdi }}</p>
      </div>

      <!-- Información personal -->
      <div class="card">
        <div class="perfil-card-hd">
          <h2 class="perfil-card-title">Información personal</h2>
          <button v-if="!editing" class="btn btn-sm btn-ghost" type="button" @click="startEdit">
            <Edit2 :size="14" /> Editar
          </button>
        </div>

        <div v-if="profileSuccess" class="alert-ok" role="status">Datos actualizados correctamente.</div>
        <div v-if="profileError" class="alert-err" role="alert">{{ profileError }}</div>

        <div v-if="!editing" class="info-list">
          <div class="info-row">
            <span class="info-lbl"><User :size="13" /> Nombres</span>
            <span class="info-val">{{ u.nombres ?? '—' }}</span>
          </div>
          <div class="info-row">
            <span class="info-lbl"><User :size="13" /> Apellidos</span>
            <span class="info-val">{{ u.apellidos ?? '—' }}</span>
          </div>
          <div class="info-row">
            <span class="info-lbl"><IdCard :size="13" /> Cédula</span>
            <span class="info-val">{{ u.cedula ?? '—' }}</span>
          </div>
          <div class="info-row">
            <span class="info-lbl"><User :size="13" /> Cargo</span>
            <span class="info-val">{{ u.cargo ?? '—' }}</span>
          </div>
          <div class="info-row">
            <span class="info-lbl"><Mail :size="13" /> Correo</span>
            <span class="info-val">{{ u.correo ?? '—' }}</span>
          </div>
          <div class="info-row">
            <span class="info-lbl"><Phone :size="13" /> Teléfono</span>
            <span class="info-val">{{ u.telefono ?? '—' }}</span>
          </div>
          <div class="info-row">
            <span class="info-lbl"><ShieldCheck :size="13" /> Rol</span>
            <span class="info-val">{{ roles }}</span>
          </div>
          <div class="info-row">
            <span class="info-lbl"><Building2 :size="13" /> UZDI</span>
            <span class="info-val">{{ uzdi }}</span>
          </div>
        </div>

        <form v-else @submit.prevent="saveProfile" class="perfil-form">
          <div class="f2col">
            <div>
              <label class="f-label">Nombres</label>
              <input v-model="profileForm.nombres" class="f-ctl" placeholder="Nombres" />
            </div>
            <div>
              <label class="f-label">Apellidos</label>
              <input v-model="profileForm.apellidos" class="f-ctl" placeholder="Apellidos" />
            </div>
          </div>
          <div>
            <label class="f-label">Correo electrónico</label>
            <input v-model="profileForm.correo" type="email" class="f-ctl" placeholder="correo@uzdi.gob.ec" />
          </div>
          <div>
            <label class="f-label">Teléfono</label>
            <input v-model="profileForm.telefono" class="f-ctl" placeholder="0999999999" />
          </div>
          <div class="perfil-actions">
            <button type="button" class="btn btn-ghost" @click="cancelEdit">
              <X :size="15" /> Cancelar
            </button>
            <button type="submit" class="btn btn-primary" :disabled="savingProfile">
              <Save :size="15" /> {{ savingProfile ? 'Guardando…' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Cambiar contraseña -->
      <div class="card">
        <div class="perfil-card-hd">
          <h2 class="perfil-card-title"><Lock :size="15" /> Cambiar contraseña</h2>
        </div>

        <div v-if="passwordSuccess" class="alert-ok">Contraseña actualizada correctamente.</div>

        <form @submit.prevent="savePassword" class="perfil-form">
          <div>
            <label class="f-label">Contraseña actual</label>
            <input v-model="passwordForm.actual" type="password" class="f-ctl"
                   :class="{ 'is-error': passwordErrors.actual }" placeholder="••••••••" />
            <p v-if="passwordErrors.actual" class="f-err">{{ passwordErrors.actual }}</p>
          </div>
          <div>
            <label class="f-label">Nueva contraseña</label>
            <input v-model="passwordForm.nueva" type="password" class="f-ctl"
                   :class="{ 'is-error': passwordErrors.nueva }" placeholder="Mínimo 8 caracteres" />
            <p v-if="passwordErrors.nueva" class="f-err">{{ passwordErrors.nueva }}</p>
          </div>
          <div>
            <label class="f-label">Confirmar nueva contraseña</label>
            <input v-model="passwordForm.confirmar" type="password" class="f-ctl"
                   :class="{ 'is-error': passwordErrors.confirmar }" placeholder="••••••••" />
            <p v-if="passwordErrors.confirmar" class="f-err">{{ passwordErrors.confirmar }}</p>
          </div>
          <div class="perfil-actions">
            <button type="submit" class="btn btn-primary" :disabled="savingPassword">
              <Lock :size="15" /> {{ savingPassword ? 'Actualizando…' : 'Actualizar contraseña' }}
            </button>
          </div>
        </form>
      </div>

    </div>
  </div>
</template>

<style scoped>
.perfil-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  grid-template-rows: auto 1fr;
  gap: 20px;
  padding: 0 0 24px;
  align-items: start;
}

.perfil-avatar {
  grid-row: 1 / 3;
  align-self: stretch;
  text-align: center;
  padding: 28px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-circle {
  width: 76px; height: 76px;
  border-radius: 50%;
  background: var(--color-brand-blue);
  color: #fff;
  font-size: 26px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.avatar-name { font-size: 15px; font-weight: 600; color: var(--color-text-primary); margin: 0 0 4px; }
.avatar-login { font-size: 13px; color: var(--color-text-muted); margin: 0; }
.avatar-rol { font-size: 12px; color: var(--color-text-muted); margin: 6px 0 0; line-height: 1.35; }

.perfil-card-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px 14px;
  border-bottom: 1px solid var(--color-border);
}

.perfil-card-title {
  font-size: 14.5px; font-weight: 600; margin: 0;
  display: flex; align-items: center; gap: 6px;
  color: var(--color-text-primary);
}

.info-list { display: flex; flex-direction: column; gap: 0; padding: 0 20px 16px; }
.info-row  { display: flex; flex-direction: column; gap: 5px; padding: 14px 0; border-bottom: 1px solid var(--color-border); }
.info-row:last-child { border-bottom: none; padding-bottom: 4px; }

.info-lbl {
  font-size: 11.5px; color: var(--color-text-muted); font-weight: 500;
  display: flex; align-items: center; gap: 4px;
  text-transform: none; letter-spacing: 0.04em;
}
.info-val { font-size: 14.5px; font-weight: 500; color: var(--color-text-primary); }

.perfil-form { display: flex; flex-direction: column; gap: 14px; padding: 16px 20px; }

.f2col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.perfil-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 4px; }

.alert-ok {
  background: var(--color-success-bg);
  color: var(--color-success);
  border: 1px solid var(--color-success-border);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  font-size: 13.5px;
  margin: 16px 20px 0;
}

.alert-err {
  background: var(--color-error-bg);
  color: var(--color-error);
  border: 1px solid var(--color-error-border);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  font-size: 13.5px;
  margin: 16px 20px 0;
}

@media (max-width: 768px) {
  .perfil-layout { grid-template-columns: 1fr; }
  .perfil-avatar { grid-row: auto; }
  .f2col { grid-template-columns: 1fr; }
}
</style>
