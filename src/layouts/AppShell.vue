<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ROLE_LABEL } from '../router/access'
import { NAV_GROUPS, navIcon, moduleLabel } from '../router/nav'
import { useAuth } from '../composables/useAuth'
import { authService } from '../services/auth.service'
import { limpiarReferencias } from '../composables/useReferencias'
import { useCatalogos } from '../composables/useCatalogos'
import { usePermisos } from '../composables/usePermisos'
import { useInactividad } from '../composables/useInactividad'
import ConfirmModal from '../components/ui/ConfirmModal.vue'
import { adolescenteService } from '../services/adolescente.service'
import { expedienteService } from '../services/expediente.service'

const route  = useRoute()
const router = useRouter()
const { user, logout: authLogout } = useAuth()
const { uzdis, cargarCatalogos } = useCatalogos()
const { visible, limpiar: limpiarPermisos } = usePermisos()
const { advertencia, segundosRestantes, iniciar, detener, seguirConectado, cerrarAhora } = useInactividad()

onMounted(() => {
  cargarCatalogos()
  iniciar()
})
onUnmounted(detener)

// ── Datos del usuario logueado ────────────────────────────────
const tppr = computed(() => (user.value?.['tppr_id'] as number) ?? 5)

const displayName = computed(() => {
  if (!user.value) return 'Usuario'
  const nom = (user.value['nombres'] as string) ?? ''
  const ape = (user.value['apellidos'] as string) ?? ''
  return `${nom} ${ape}`.trim() || 'Usuario'
})

const displayInitials = computed(() => {
  const parts = displayName.value.split(' ').filter(Boolean)
  return parts.slice(0, 2).map(p => p[0]).join('').toUpperCase() || 'US'
})

const displayRole = computed(() => ROLE_LABEL[tppr.value] ?? 'Usuario')

const uzdiName = computed(() => {
  const uid = user.value?.['uzdi_id'] as number | undefined
  if (uid && uzdis.value.length) {
    const found = uzdis.value.find(u => u.id === uid)
    if (found) return found.nombre
  }
  return 'UZDI'
})

function doLogout() {
  const anterior = localStorage.getItem('uzdi_token')
  authLogout()
  limpiarPermisos()
  limpiarReferencias()
  void router.replace('/login')
  // La navegación y el cierre local nunca esperan al free tier de Render.
  if (anterior) void authService.logout(anterior).catch(() => {
    // La sesión ya se cerró en este navegador; el token caducará en el servidor.
  })
}

// ── Búsqueda global ───────────────────────────────────────────
const searchOpen    = ref(false)
const searchQuery   = ref('')
const searchInputEl = ref<HTMLInputElement | null>(null)
const searchLoading = ref(false)
const searchLoaded  = ref(false)

interface SearchItem { tipo: string; nombre: string; detalle: string; ruta: string; tono: string }
const allItems = ref<SearchItem[]>([])

async function loadSearchData() {
  if (searchLoaded.value || searchLoading.value) return
  searchLoading.value = true
  try {
    // RNF-02/RNF-05: la búsqueda solo indexa entidades que el rol puede consultar.
    const puedeAdolescentes = visible('adolescentes')
    const puedeExpedientes = visible('expedientes')
    const [adols, expes] = await Promise.all([
      puedeAdolescentes ? adolescenteService.getAll() : Promise.resolve([]),
      puedeExpedientes ? expedienteService.getAll() : Promise.resolve([]),
    ])
    allItems.value = [
      ...adols.map(a => ({
        tipo: 'Adolescente',
        nombre: a.nombre,
        detalle: `C.C. ${a.ced}`,
        ruta: '/app/adolescentes',
        tono: 'blue',
      })),
      ...expes.map(e => ({
        tipo: 'Expediente',
        nombre: `${e.codigo} · ${e.adol}`,
        detalle: `${e.infraccion} · ${e.estado}`,
        ruta: '/app/expedientes',
        tono: 'green',
      })),
    ]
    searchLoaded.value = true
  } catch {
    allItems.value = []
  } finally {
    searchLoading.value = false
  }
}

const searchResults = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return allItems.value.slice(0, 6)
  return allItems.value
    .filter(it => it.nombre.toLowerCase().includes(q) || it.detalle.toLowerCase().includes(q))
    .slice(0, 8)
})

function openSearch()  {
  searchOpen.value = true
  searchQuery.value = ''
  loadSearchData()
}
function closeSearch() { searchOpen.value = false }
function goTo(ruta: string) { router.push(ruta); closeSearch() }

function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch() }
  if (e.key === 'Escape') closeSearch()
}

watch(searchOpen, async (v) => { if (v) { await nextTick(); searchInputEl.value?.focus() } })
onMounted(()   => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

// ── Sidebar responsive ───────────────────────────────────────────
const sidebarOpen = ref(false)
function toggleSidebar() { sidebarOpen.value = !sidebarOpen.value }
function closeSidebar()  { sidebarOpen.value = false }
watch(() => route.path, closeSidebar)

// ── Navegación filtrada por rol ───────────────────────────────
const navGroups = computed(() =>
  NAV_GROUPS
    .map((group) => ({ group: group.group, items: group.items.filter((item) => visible(item.id)) }))
    .filter((group) => group.items.length > 0),
)

const crumbLabel = (path: string): string => moduleLabel(path)
</script>

<template>
  <div style="height:100vh;overflow:hidden;display:flex;flex-direction:column;">
    <div class="app-body app-root">
      <!-- ── SIDEBAR ──────────────────────── -->
      <div v-if="sidebarOpen" class="sb-scrim" @click="closeSidebar" />
      <aside class="sb" :class="{ 'is-open': sidebarOpen }">
        <div class="sb-brand">
          <div class="sb-logo-mark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2 3 5.5v6.2C3 17 6.9 20.7 12 22c5.1-1.3 9-5 9-10.3V5.5L12 2Z" fill="#fff"/>
              <path d="m8.6 12.4 2.4 2.4 4.6-4.9" stroke="#1e3a8a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </div>
          <div class="sb-logo-text"><b>UZDI</b><span>Gestión Integral</span></div>
        </div>

        <nav class="sb-nav">
          <div v-for="g in navGroups" :key="g.group" class="sb-group">
            <div class="sb-group-label">{{ g.group }}</div>
            <RouterLink
              v-for="it in g.items"
              :key="it.id"
              :to="it.to"
              class="sb-item"
              :class="{ 'is-active': route.path.startsWith(it.to) }"
            >
              <!-- eslint-disable-next-line vue/no-v-html -->
              <span v-html="navIcon(it.icon)" style="display:contents" />
              <span>{{ it.label }}</span>
            </RouterLink>
          </div>
        </nav>

        <div class="sb-foot">
          <div class="sb-user">
            <div class="sb-avatar">{{ displayInitials }}</div>
            <div class="sb-user-info">
              <b>{{ displayName }}</b>
              <span>{{ displayRole }}</span>
            </div>
          </div>
          <button class="sb-logout" type="button" @click="doLogout()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <!-- ── MAIN ────────────────────────── -->
      <div class="main">
        <header class="tb">
          <button class="tb-menu" type="button" aria-label="Abrir menú" @click="toggleSidebar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div class="tb-crumb">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9.5 12 3l9 6.5"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>
            </svg>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
            <b>{{ crumbLabel(route.path) }}</b>
          </div>

          <div class="tb-right">
            <!-- Barra de búsqueda clickable -->
            <div class="tb-search" style="cursor:pointer;" @click="openSearch">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <span>Buscar en el sistema…</span>
              <span style="font-size:11px;color:var(--color-text-placeholder);margin-left:auto;padding-left:8px;">Ctrl+K</span>
            </div>

            <div class="tb-uzdi">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {{ uzdiName }}
            </div>

            <button class="tb-icon-btn" type="button" aria-label="Notificaciones">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
              </svg>
              <span class="dot-notif" />
            </button>

            <button class="tb-icon-btn tb-logout" type="button" aria-label="Cerrar sesión" title="Cerrar sesión" @click="doLogout()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>
              </svg>
            </button>
          </div>
        </header>

        <div class="page">
          <div class="page-inner">
            <RouterView />
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ── OVERLAY DE BÚSQUEDA GLOBAL ────────────────────────────── -->
  <Teleport to="body">
    <div v-if="searchOpen" class="gs-backdrop" @click.self="closeSearch">
      <div class="gs-modal" role="dialog" aria-label="Búsqueda global">

        <!-- Input -->
        <div class="gs-input-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            ref="searchInputEl"
            v-model="searchQuery"
            class="gs-input"
            type="text"
            placeholder="Buscar adolescentes, expedientes, medidas…"
            autocomplete="off"
            spellcheck="false"
          />
          <button class="gs-esc-btn" type="button" @click="closeSearch">Esc</button>
        </div>

        <!-- Resultados -->
        <div v-if="searchLoading" class="gs-empty" style="font-size:13px;">Cargando datos…</div>
        <div v-else-if="searchResults.length" class="gs-results">
          <div
            v-for="it in searchResults"
            :key="it.nombre + it.detalle"
            class="gs-item"
            @click="goTo(it.ruta)"
          >
            <span :class="['gs-badge', it.tono]">{{ it.tipo }}</span>
            <div class="gs-item-text">
              <b>{{ it.nombre }}</b>
              <span>{{ it.detalle }}</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </div>
        </div>
        <div v-else class="gs-empty">
          {{ searchQuery ? `Sin resultados para "${searchQuery}"` : 'Sin datos disponibles' }}
        </div>

        <!-- Footer de atajos -->
        <div class="gs-footer">
          <span>Esc · cerrar</span>
          <span>↵ · abrir módulo</span>
          <span>Ctrl+K · abrir/cerrar</span>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ── AVISO DE INACTIVIDAD (RNF-04) ─────────────────────────── -->
  <ConfirmModal
    :show="advertencia"
    variant="warn"
    title="Sesión por cerrarse"
    :message="`Por seguridad, su sesión se cerrará por inactividad en ${segundosRestantes} segundos.`"
    confirm-label="Cerrar sesión ahora"
    cancel-label="Seguir conectado"
    @confirm="cerrarAhora"
    @cancel="seguirConectado"
  />
</template>

<style scoped>
.gs-backdrop {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 100px;
}
.gs-modal {
  width: 560px;
  max-width: 90vw;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}
.gs-input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
}
.gs-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px;
  color: var(--color-text-primary);
  font-family: var(--font-base);
}
.gs-input::placeholder { color: var(--color-text-placeholder); }
.gs-esc-btn {
  font-size: 11px;
  padding: 3px 7px;
  border-radius: 5px;
  border: 1px solid var(--color-border);
  background: var(--color-surface-soft);
  color: var(--color-text-secondary);
  cursor: pointer;
  font-family: var(--font-base);
}
.gs-results { max-height: 340px; overflow-y: auto; }
.gs-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background .12s;
}
.gs-item:hover { background: var(--color-surface-soft); }
.gs-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  flex-shrink: 0;
  text-transform: none;
  letter-spacing: 0.04em;
}
.gs-badge.blue  { background: var(--color-info-border); color: var(--color-brand-blue); }
.gs-badge.green { background: var(--color-success-bg); color: var(--color-success); }
.gs-badge.amber { background: var(--color-warning-bg); color: var(--color-warning); }
.gs-item-text { flex: 1; min-width: 0; }
.gs-item-text b {
  display: block;
  font-size: 14px;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.gs-item-text span { font-size: 12px; color: var(--color-text-secondary); }
.gs-empty {
  padding: 24px 16px;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 14px;
}
.gs-footer {
  display: flex;
  gap: 16px;
  padding: 10px 16px;
  border-top: 1px solid var(--color-border);
  background: var(--color-surface-soft);
  font-size: 11px;
  color: var(--color-text-placeholder);
}
</style>
