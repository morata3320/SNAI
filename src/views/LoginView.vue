<script setup lang="ts">
import { reactive, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService } from '../services/auth.service'
import { useAuth } from '../composables/useAuth'
import { usePermisos } from '../composables/usePermisos'
import { leerSeguridad } from '../config/seguridad'
import { mensajeErrorApi } from '../services/response'

interface Banner {
  type: 'error' | 'warning' | 'info' | 'success'
  icon: 'error' | 'inactive' | 'perms' | 'connection' | 'session' | 'success' | 'fields'
  title: string
  msg: string
}

const isMock = import.meta.env.VITE_USE_MOCK === 'true'
const demoUsers = [
  ['superadmin', 'Superadministrador'], ['admin', 'Administrador'], ['coordinador', 'Coordinador de área'],
  ['tsocial', 'Trabajador Social'], ['psicologo', 'Psicólogo'], ['educador', 'Educador'], ['juridico', 'Jurídico'],
]
function fillDemo(login: string) {
  form.usuario.value = login
  form.password.value = 'Snai2026'
  form.usuario.error = ''
  form.password.error = ''
  form.banner = null
}

const route  = useRoute()
const router = useRouter()
const { setSession } = useAuth()
const { cargar: cargarPermisos } = usePermisos()

const seguridad = leerSeguridad()
const LS_LOCK = 'uzdi_login_lock'

interface BloqueoLogin {
  usuario: string
  hasta: number
}

function leerBloqueo(): BloqueoLogin | null {
  try {
    const raw = localStorage.getItem(LS_LOCK)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<BloqueoLogin>
    if (typeof parsed.usuario !== 'string' || typeof parsed.hasta !== 'number') return null
    return parsed.hasta > Date.now() ? { usuario: parsed.usuario, hasta: parsed.hasta } : null
  } catch {
    return null
  }
}

const form = reactive({
  usuario: { value: '', error: '' },
  password: { value: '', error: '', visible: false },
  remember: false,
  loading: false,
  success: false,
  banner: null as Banner | null,
  attempts: seguridad.intentosMaximos,
})

const bloqueo = ref<BloqueoLogin | null>(leerBloqueo())
const ahora = ref(Date.now())
let reloj: ReturnType<typeof setInterval> | undefined

const bloqueado = computed(() => !!bloqueo.value && bloqueo.value.hasta > ahora.value)
const segundosRestantes = computed(() =>
  Math.max(0, Math.ceil(((bloqueo.value?.hasta ?? 0) - ahora.value) / 1000))
)
const restanteTexto = computed(() => {
  const total = segundosRestantes.value
  const min = Math.floor(total / 60)
  const seg = String(total % 60).padStart(2, '0')
  return `${min}:${seg}`
})

function mostrarBloqueo() {
  const usuario = form.usuario.value.trim().toLowerCase()
  form.banner = {
    type: 'error',
    icon: 'error',
    title: 'Acceso bloqueado temporalmente',
    msg: `Demasiados intentos fallidos. Intente nuevamente en ${restanteTexto.value}. El bloqueo real se valida en el backend.`,
  }
  if (usuario && bloqueo.value && bloqueo.value.usuario !== usuario) {
    bloqueo.value = null
    localStorage.removeItem(LS_LOCK)
    form.attempts = seguridad.intentosMaximos
  }
}

function registrarIntentoFallido() {
  form.attempts = Math.max(0, form.attempts - 1)
  if (form.attempts > 0) {
    form.banner = {
      type: 'error',
      icon: 'error',
      title: 'Credenciales inválidas',
      msg: `Usuario o contraseña incorrectos. Intentos restantes: ${form.attempts}.`,
    }
    return
  }
  const hasta = Date.now() + seguridad.duracionBloqueoMin * 60_000
  bloqueo.value = { usuario: form.usuario.value.trim().toLowerCase(), hasta }
  localStorage.setItem(LS_LOCK, JSON.stringify(bloqueo.value))
  mostrarBloqueo()
}

function limpiarBloqueo() {
  bloqueo.value = null
  localStorage.removeItem(LS_LOCK)
  form.attempts = seguridad.intentosMaximos
}

function onUsuarioInput() {
  clearFieldErrors()
  form.usuario.error = ''
  if (bloqueo.value && bloqueo.value.usuario !== form.usuario.value.trim().toLowerCase()) {
    bloqueo.value = null
    localStorage.removeItem(LS_LOCK)
  }
  if (!bloqueado.value) form.attempts = seguridad.intentosMaximos
}

function mostrarAyudaClave() {
  form.banner = {
    type: 'info',
    icon: 'perms',
    title: 'Restablecimiento de contraseña',
    msg: 'Solicite el restablecimiento al administrador de su UZDI. La contraseña temporal deberá cambiarse al ingresar.',
  }
}

onMounted(() => {
  if (route.query.expired) {
    form.banner = {
      type: 'info',
      icon: 'session',
      title: 'Su sesión ha expirado',
      msg: 'Por seguridad, su sesión se cerró por inactividad. Vuelva a iniciar sesión para continuar.',
    }
  } else if (bloqueado.value) {
    mostrarBloqueo()
  }
  reloj = setInterval(() => {
    ahora.value = Date.now()
    if (bloqueo.value && bloqueo.value.hasta <= Date.now()) {
      limpiarBloqueo()
      form.banner = null
    } else if (bloqueado.value && form.banner?.title === 'Acceso bloqueado temporalmente') {
      mostrarBloqueo()
    }
  }, 1000)
})

onBeforeUnmount(() => {
  if (reloj) clearInterval(reloj)
})

function clearFieldErrors() {
  if (form.banner?.icon === 'fields') form.banner = null
}

function validateLogin(val: string): string {
  if (!val.trim()) return 'El usuario es obligatorio.'
  return ''
}

async function handleSubmit() {
  if (form.loading || form.success) return
  if (bloqueado.value) {
    mostrarBloqueo()
    return
  }

  form.usuario.error = ''
  form.password.error = ''
  form.banner = null

  const usuErr = validateLogin(form.usuario.value)
  const passErr = !form.password.value.trim() ? 'La contraseña es obligatoria.' : ''

  form.usuario.error = usuErr
  form.password.error = passErr

  if (usuErr || passErr) {
    if (!form.usuario.value.trim() && !form.password.value.trim()) {
      form.banner = {
        type: 'error',
        icon: 'fields',
        title: 'Complete los campos requeridos',
        msg: 'Debe ingresar su usuario y contraseña para continuar.',
      }
    }
    return
  }

  form.loading = true

  try {
    const { token, user } = await authService.login(form.usuario.value, form.password.value)
    limpiarBloqueo()
    setSession(token, user)
    // RF-10: la matriz vigente se fija al iniciar sesión y rige hasta el siguiente ingreso.
    await cargarPermisos()
    form.success = true
    form.banner = {
      type: 'success',
      icon: 'success',
      title: 'Inicio de sesión exitoso',
      msg: 'Redirigiendo al panel principal…',
    }
    setTimeout(() => router.push('/app/dashboard'), 800)
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 401) {
      registrarIntentoFallido()
    } else {
      form.banner = {
        type: 'error',
        icon: 'connection',
        title: 'No se pudo iniciar sesión',
        msg: mensajeErrorApi(err, err instanceof Error ? err.message : 'No fue posible completar el inicio de sesión.'),
      }
    }
  } finally {
    form.loading = false
  }
}
</script>

<template>
  <div class="lg-root">
    <!-- BRAND PANEL (desktop only) -->
    <aside class="lg-brand">
      <div class="lg-brand-inner">
        <div class="lg-logo">
          <div class="lg-logo-mark">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M14 2L3 7v8c0 7.18 4.74 13.89 11 15.93C20.26 28.89 25 22.18 25 15V7L14 2z" fill="url(#shield-g)"/>
              <path d="M9 14l3.5 3.5L19 10.5" stroke="#1e3a8a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              <defs>
                <linearGradient id="shield-g" x1="3" y1="2" x2="25" y2="28" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#ffffff"/>
                  <stop offset="1" stop-color="#e2e8f0"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div class="lg-logo-text">
            <b>UZDI</b>
            <span>Gestión Integral</span>
          </div>
        </div>

        <div class="lg-brand-mid">
          <h1 class="lg-brand-heading">Sistema de Gestión Integral UZDI</h1>
          <p class="lg-brand-sub">
            Plataforma unificada para la administración, seguimiento y control de los procesos de desarrollo institucional a nivel nacional.
          </p>

          <div class="lg-secnote">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lg-secnote-icon">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <p><strong>Acceso restringido:</strong> Solo personal autorizado UZDI puede ingresar a este sistema.</p>
          </div>
        </div>

        <p class="lg-brand-foot">© 2026 UZDI · Todos los derechos reservados</p>
      </div>
    </aside>

    <!-- FORM PANEL -->
    <main class="lg-form-pane">
      <div class="lg-card">
        <!-- Logo (visible en tablet/mobile) -->
        <div class="lg-card-logo">
          <div class="lg-logo">
            <div class="lg-logo-mark lg-logo-mark--light">
              <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
                <path d="M14 2L3 7v8c0 7.18 4.74 13.89 11 15.93C20.26 28.89 25 22.18 25 15V7L14 2z" fill="url(#shield-g2)"/>
                <path d="M9 14l3.5 3.5L19 10.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                <defs>
                  <linearGradient id="shield-g2" x1="3" y1="2" x2="25" y2="28" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#1d4ed8"/>
                    <stop offset="1" stop-color="#1e3a8a"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div class="lg-logo-text lg-logo-text--dark">
              <b>UZDI</b>
              <span>Gestión Integral</span>
            </div>
          </div>
        </div>

        <!-- Header -->
        <div class="lg-card-head">
          <h2 class="lg-card-title">Iniciar sesión</h2>
          <p class="lg-card-sub">Ingrese sus credenciales institucionales para continuar</p>
        </div>

        <!-- Banner -->
        <Transition name="banner">
          <div
            v-if="form.banner"
            class="lg-banner"
            :class="`is-${form.banner.type}`"
            role="alert"
          >
            <span class="lg-banner-icon">
              <svg v-if="form.banner.icon === 'fields' || form.banner.icon === 'error'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <svg v-else-if="form.banner.icon === 'inactive'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              <svg v-else-if="form.banner.icon === 'perms'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" y1="11" x2="23" y2="17"/><line x1="23" y1="11" x2="17" y2="17"/></svg>
              <svg v-else-if="form.banner.icon === 'connection'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
              <svg v-else-if="form.banner.icon === 'session'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <svg v-else-if="form.banner.icon === 'success'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </span>
            <div class="lg-banner-txt">
              <strong>{{ form.banner.title }}</strong>
              <span>{{ form.banner.msg }}</span>
            </div>
          </div>
        </Transition>

        <!-- Form -->
        <form class="lg-form" @submit.prevent="handleSubmit" novalidate>
          <!-- Campo usuario -->
          <div class="lg-field">
            <label class="lg-label" for="usuario">
              Usuario <span class="req">*</span>
            </label>
            <div class="lg-input-wrap">
              <span class="lg-input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
              <input
                id="usuario"
                v-model="form.usuario.value"
                class="lg-input"
                :class="{ 'is-error': form.usuario.error, 'is-disabled': form.loading || form.success }"
                type="text"
                placeholder="Ej. admin"
                autocomplete="username"
                :disabled="form.loading || form.success"
                @input="onUsuarioInput"
              />
            </div>
            <Transition name="err">
              <div v-if="form.usuario.error" class="lg-error-msg">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {{ form.usuario.error }}
              </div>
            </Transition>
          </div>

          <!-- Campo contraseña -->
          <div class="lg-field">
            <label class="lg-label" for="password">
              Contraseña <span class="req">*</span>
            </label>
            <div class="lg-input-wrap">
              <span class="lg-input-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input
                id="password"
                v-model="form.password.value"
                class="lg-input"
                :class="{ 'is-error': form.password.error, 'is-disabled': form.loading || form.success }"
                :type="form.password.visible ? 'text' : 'password'"
                placeholder="Mínimo 8 caracteres"
                autocomplete="current-password"
                :disabled="form.loading || form.success"
                @input="clearFieldErrors(); form.password.error = ''"
              />
              <button
                type="button"
                class="lg-eye"
                :aria-label="form.password.visible ? 'Ocultar contraseña' : 'Mostrar contraseña'"
                @click="form.password.visible = !form.password.visible"
                :disabled="form.loading || form.success"
              >
                <svg v-if="!form.password.visible" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
            </div>
            <Transition name="err">
              <div v-if="form.password.error" class="lg-error-msg">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {{ form.password.error }}
              </div>
            </Transition>
          </div>

          <!-- Row: remember + forgot -->
          <div class="lg-row">
            <label class="lg-check">
              <span class="box" :class="{ checked: form.remember }">
                <svg v-if="form.remember" width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="2 6 5 9 10 3"/></svg>
              </span>
              <input type="checkbox" v-model="form.remember" :disabled="form.loading || form.success" />
              Mantener sesión iniciada
            </label>
            <a href="#" class="lg-link" @click.prevent="mostrarAyudaClave">¿Olvidó su contraseña?</a>
          </div>

          <!-- Submit button -->
          <button
            type="submit"
            class="lg-btn"
            :class="{ 'is-loading': form.loading, 'is-success': form.success }"
            :disabled="form.loading || form.success || bloqueado"
            :aria-busy="form.loading"
          >
            <Transition name="btn-content" mode="out-in">
              <span v-if="form.loading" key="loading" class="lg-btn-inner">
                <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                Verificando credenciales…
              </span>
              <span v-else-if="form.success" key="success" class="lg-btn-inner">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Ingreso confirmado – Redirigiendo…
              </span>
              <span v-else-if="bloqueado" key="locked" class="lg-btn-inner">
                Acceso bloqueado · {{ restanteTexto }}
              </span>
              <span v-else key="default" class="lg-btn-inner">
                Ingresar al sistema
              </span>
            </Transition>
          </button>
        </form>

        <div v-if="isMock" class="lg-demo">
          <p>Modo demostración: elija un perfil. La contraseña es <code>Snai2026</code>.</p>
          <div class="lg-chips">
            <button v-for="d in demoUsers" :key="d[0]" type="button" class="lg-chip" @click="fillDemo(d[0])">{{ d[1] }}</button>
          </div>
        </div>

        <p class="lg-card-foot">
          ¿Problemas para acceder? Contacte al
          <a href="#" @click.prevent>administrador de su UZDI</a>
        </p>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ── TOKENS (heredan del design system) ────────────────── */
.lg-root {
  --blue:        var(--color-brand-blue);
  --blue-dark:   var(--color-brand-dark);
  --yellow:      var(--color-brand-yellow);

  --ok:          var(--color-success);
  --ok-bg:       var(--color-success-bg);
  --ok-bd:       var(--color-success-border);
  --warn:        #ea580c;
  --warn-bg:     var(--color-warning-bg);
  --warn-bd:     var(--color-warning-border);
  --err:         var(--color-error);
  --err-bg:      var(--color-error-bg);
  --err-bd:      var(--color-error-border);
  --info-bg:     var(--color-mark-tint);
  --info-bd:     #3b82f6;

  --surf-soft:   var(--color-paper);
  --surf-mute:   var(--color-surface-mute);
  --border:      var(--color-border);
  --border-h:    var(--color-border-hover);
  --txt-1:       var(--color-text-primary);
  --txt-2:       var(--color-text-secondary);
  --txt-muted:   var(--color-text-muted);
  --txt-ph:      var(--color-text-placeholder);

  --r-md:   10px;
  --r-lg:   12px;
  --ff: var(--font-base);
}

/* ── ROOT LAYOUT ───────────────────────────────────────── */
.lg-root {
  min-height: 100dvh;
  display: flex;
  font-family: var(--ff);
  font-size: 15px;
  color: var(--txt-1);
  background: var(--surf-soft);
}

/* ── PANEL DE MARCA (azul de sello, tipografía como protagonista) ─── */
.lg-brand {
  display: none;
  width: 46%;
  max-width: 640px;
  flex: 0 0 46%;
  position: relative;
  overflow: hidden;
  background: var(--gradient-brand);
  color: #ffffff;
}
.lg-brand::before, .lg-brand::after { content: ""; position: absolute; border-radius: 50%; pointer-events: none; background: rgba(255,255,255,.08); }
.lg-brand::before { width: 420px; height: 420px; right: -150px; top: -130px; }
.lg-brand::after  { width: 260px; height: 260px; left: -90px; bottom: -80px; background: rgba(255,255,255,.06); }
.lg-brand-inner { position: relative; z-index: 1; }

.lg-brand-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 56px 52px;
}

.lg-brand-mid {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 460px;
}

.lg-brand-heading {
  font-family: var(--font-display);
  font-size: clamp(2.3rem, 3.6vw, 3.3rem);
  font-weight: 700;
  line-height: 1.02;
  color: #fff;
  letter-spacing: -0.03em;
  margin: 0 0 20px;
  text-wrap: balance;
}

.lg-brand-sub {
  font-size: 17px;
  line-height: 1.55;
  color: #dbeafe;
  margin: 0 0 28px;
  max-width: 44ch;
  text-wrap: pretty;
}

.lg-secnote {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 2px 0 2px 16px;
  border-left: 4px solid var(--yellow);
  font-size: 14px;
  line-height: 1.5;
}

.lg-secnote-icon { flex: 0 0 auto; margin-top: 2px; color: var(--yellow); }
.lg-secnote p { margin: 0; color: #eff6ff; }
.lg-secnote strong { color: #fff; font-weight: 700; }

.lg-brand-foot {
  font-size: 13px;
  color: #bfdbfe;
  margin: 0;
}

/* ── LOGO: pestaña de carpeta que cuelga del borde superior ── */
.lg-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.lg-brand .lg-logo {
  align-self: flex-start;
  background: #fff;
  padding: 14px 22px 16px;
  border-radius: 0 0 16px 16px;
  box-shadow: 0 10px 24px rgba(15,23,42,.25);
}

.lg-logo-mark {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: var(--blue);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.lg-logo-mark svg path:last-child { stroke: var(--blue); }
.lg-logo-mark--light { background: var(--blue); }

.lg-logo-text b {
  display: block;
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  color: var(--txt-1);
  letter-spacing: -0.01em;
  line-height: 1;
}
.lg-logo-text span {
  display: block;
  font-size: 12.5px;
  color: var(--txt-1);
  margin-top: 3px;
}
.lg-logo-text--dark b    { color: var(--txt-1); }
.lg-logo-text--dark span { color: var(--txt-muted); }

/* ── PANEL DEL FORMULARIO (sobre el papel) ─────────────── */
.lg-form-pane {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
}

.lg-card {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.lg-card-logo { display: flex; }

.lg-card-head { display: flex; flex-direction: column; gap: 4px; }

.lg-card-title {
  font-family: var(--font-display);
  font-size: 1.9rem;
  font-weight: 700;
  color: var(--txt-1);
  letter-spacing: -0.02em;
  margin: 0;
}

.lg-card-sub {
  font-size: 15px;
  color: var(--txt-muted);
  line-height: 1.45;
  margin: 0;
}

.lg-card-foot {
  font-size: 13.5px;
  color: var(--txt-muted);
  border-top: 1px solid var(--border);
  padding-top: 18px;
  margin: 2px 0 0;
}

.lg-card-foot a { color: var(--blue); font-weight: 700; }

/* ── BANNER (franja lateral de color) ──────────────────── */
.lg-banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 0 6px 6px 0;
  border: 0;
  border-left: 5px solid;
  font-size: 14px;
  line-height: 1.4;
}

.lg-banner.is-error   { background: var(--err-bg);  border-color: var(--err);  color: var(--txt-1); }
.lg-banner.is-warning { background: var(--warn-bg); border-color: var(--warn); color: var(--txt-1); }
.lg-banner.is-info    { background: var(--info-bg); border-color: var(--info-bd); color: var(--txt-1); }
.lg-banner.is-success { background: var(--ok-bg);   border-color: var(--ok);   color: var(--txt-1); }

.lg-banner.is-error .lg-banner-icon { color: var(--err); }
.lg-banner.is-success .lg-banner-icon { color: var(--ok); }
.lg-banner-icon { flex-shrink: 0; margin-top: 1px; }
.lg-banner-txt { line-height: 1.4; }
.lg-banner-txt strong { display: block; font-weight: 700; }
.lg-banner-txt span   { display: block; margin-top: 2px; color: var(--txt-2); }

/* ── FORM ──────────────────────────────────────────────── */
.lg-form { display: flex; flex-direction: column; gap: 18px; }

.lg-field { display: flex; flex-direction: column; gap: 6px; }

.lg-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 700;
  color: var(--txt-1);
}
.lg-label .req { color: var(--err); font-weight: 700; }

.lg-input-wrap { position: relative; display: block; }

.lg-input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--txt-muted);
  pointer-events: none;
  display: flex;
  align-items: center;
}

.lg-input {
  width: 100%;
  min-height: 50px;
  padding: 12px 16px 12px 44px;
  border: 1px solid var(--border-h);
  border-radius: var(--r-lg);
  background: #fff;
  font-family: var(--ff);
  font-size: 15.5px;
  color: var(--txt-1);
  outline: none;
  transition: border-color .12s ease;
  box-sizing: border-box;
  -webkit-appearance: none;
}
.lg-input::placeholder { color: var(--txt-ph); }
.lg-input:focus {
  outline: 3px solid var(--blue);
  outline-offset: 0;
  border-color: var(--blue);
}
.lg-input.is-error { border-color: var(--err); }
.lg-input.is-error:focus { outline-color: var(--err); }
.lg-input.is-disabled,
.lg-input:disabled { background: var(--surf-mute); color: var(--txt-muted); cursor: not-allowed; }

.lg-input-wrap:has(.lg-eye) .lg-input { padding-right: 48px; }

.lg-eye {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--txt-muted);
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--r-md);
}
.lg-eye:hover { background: var(--surf-mute); color: var(--txt-1); }
.lg-eye:disabled { cursor: not-allowed; opacity: 0.4; }

.lg-error-msg {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13.5px;
  color: var(--err);
  font-weight: 700;
}
.lg-error-msg svg { flex: 0 0 auto; }

/* ── RECORDAR + OLVIDÉ ─────────────────────────────────── */
.lg-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin: 0;
}

.lg-check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--txt-1);
  cursor: pointer;
  user-select: none;
}
.lg-check input[type="checkbox"] { display: none; }
.lg-check .box {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1.5px solid var(--border-h);
  background: #fff;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.lg-check .box.checked { background: var(--blue); border-color: var(--blue); }

.lg-link { font-size: 14px; color: var(--blue); font-weight: 700; white-space: nowrap; cursor: pointer; }
.lg-link:hover { text-decoration: underline; }

/* ── BOTÓN ─────────────────────────────────────────────── */
.lg-btn {
  width: 100%;
  min-height: 50px;
  border: 0;
  border-radius: 12px;
  background: var(--gradient-action);
  box-shadow: 0 10px 24px rgba(30,58,138,.35);
  color: #ffffff;
  font-family: var(--ff);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  transition: background-color .12s ease;
}
.lg-btn:hover:not(:disabled) { filter: brightness(1.12); }
.lg-btn:disabled { cursor: not-allowed; }
.lg-btn.is-loading { cursor: progress; opacity: 0.9; }
.lg-btn.is-success { background: var(--ok); border-color: var(--ok); }
.lg-btn:focus-visible { outline: 3px solid var(--blue); outline-offset: 3px; }

.lg-btn-inner { display: flex; align-items: center; justify-content: center; gap: 8px; }
.spinner { animation: spin .7s linear infinite; flex: 0 0 auto; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── ACCESO RÁPIDO (solo modo demo) ────────────────────── */
.lg-demo {
  border-top: 1px solid var(--border);
  padding-top: 16px;
}
.lg-demo p { margin: 0 0 10px; font-size: 13.5px; color: var(--txt-muted); }
.lg-demo code { background: var(--surf-mute); padding: 1px 6px; border-radius: 4px; font-size: .95em; color: var(--txt-1); }
.lg-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.lg-chip {
  font: inherit;
  font-size: 13.5px;
  font-weight: 700;
  min-height: 36px;
  padding: 4px 12px;
  border: 1px solid var(--border-h);
  border-radius: var(--r-md);
  background: #fff;
  color: var(--txt-1);
  cursor: pointer;
}
.lg-chip:hover { background: var(--color-brand-tint); border-color: var(--color-info-border); color: var(--color-brand-blue); }

/* ── TRANSICIONES (breves; se anulan con reduced-motion) ── */
.banner-enter-active,
.banner-leave-active { transition: opacity .18s ease, transform .18s ease; }
.banner-enter-from   { opacity: 0; transform: translateY(-4px); }
.banner-leave-to     { opacity: 0; }

.err-enter-active,
.err-leave-active { transition: opacity .15s ease; }
.err-enter-from,
.err-leave-to     { opacity: 0; }

.btn-content-enter-active,
.btn-content-leave-active { transition: opacity .12s ease; }
.btn-content-enter-from,
.btn-content-leave-to     { opacity: 0; }

/* ── RESPONSIVE ────────────────────────────────────────── */
@media (min-width: 640px) {
  .lg-form-pane { padding: 48px; }
}

@media (min-width: 900px) {
  .lg-brand { display: flex; flex-direction: column; }
  .lg-card-logo { display: none; }
  .lg-form-pane { padding: 48px 56px; }
}

@media (prefers-reduced-motion: reduce) {
  .spinner { animation: none; }
}
</style>
