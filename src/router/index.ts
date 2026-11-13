import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import LoginView        from '../views/LoginView.vue'
import AppShell         from '../layouts/AppShell.vue'
import DashboardView    from '../views/DashboardView.vue'
import AdolescentesView from '../views/AdolescentesView.vue'
import ExpedientesView  from '../views/ExpedientesView.vue'
import MedidasView      from '../views/MedidasView.vue'
import ReportesView     from '../views/ReportesView.vue'
import PerfilView       from '../views/PerfilView.vue'
import UsuariosView     from '../views/UsuariosView.vue'
import ParametrosView   from '../views/ParametrosView.vue'
import ModuleView        from '../views/ModuleView.vue'
import RepresentantesView from '../views/RepresentantesView.vue'
import ContextoFamiliarView from '../views/ContextoFamiliarView.vue'
import CatalogosView     from '../views/CatalogosView.vue'
import PermisosView      from '../views/PermisosView.vue'
import BitacoraView      from '../views/BitacoraView.vue'
import InformesView      from '../views/InformesView.vue'

import { canAccess, type ModuleId } from './access'
import { permisosVigentes } from '../composables/usePermisos'
import { useToast } from '../composables/useToast'
import { moduloDisponibleEnBackend } from '../services/backend-contract'

const router = createRouter({
  // Con VITE_ROUTER_MODE=hash (GitHub Pages) las rutas van tras «#», sin configuración de servidor.
  history: import.meta.env.VITE_ROUTER_MODE === 'hash'
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginView },
    {
      path: '/app',
      component: AppShell,
      redirect: '/app/dashboard',
      children: [
        { path: 'dashboard',    component: DashboardView,    meta: { module: 'dashboard' } },
        { path: 'adolescentes', component: AdolescentesView, meta: { module: 'adolescentes' } },
        { path: 'representantes', component: RepresentantesView, meta: { module: 'representantes' } },
        { path: 'contexto-familiar', component: ContextoFamiliarView, meta: { module: 'contexto-familiar' } },
        { path: 'alertas-salud', component: ModuleView, meta: { module: 'alertas-salud' } },
        { path: 'fichas',       component: ModuleView,       meta: { module: 'fichas' } },
        { path: 'educacion',    component: ModuleView,       meta: { module: 'educacion' } },
        { path: 'talleres',     component: ModuleView,       meta: { module: 'talleres' } },
        { path: 'asistencia-talleres', component: ModuleView, meta: { module: 'asistencia-talleres' } },
        { path: 'expedientes',  component: ExpedientesView,  meta: { module: 'expedientes' } },
        { path: 'medidas',      component: MedidasView,      meta: { module: 'medidas' } },
        { path: 'documentos',   component: ModuleView,       meta: { module: 'documentos' } },
        { path: 'gdos',         component: ModuleView,       meta: { module: 'gdos' } },
        { path: 'catalogos',    component: CatalogosView,    meta: { module: 'catalogos' } },
        { path: 'asignacion-casos', component: ModuleView,   meta: { module: 'asignacion-casos' } },
        { path: 'reportes',     component: ReportesView,     meta: { module: 'reportes' } },
        { path: 'informes',     component: InformesView,     meta: { module: 'informes' } },
        { path: 'perfil',       component: PerfilView,       meta: { module: 'perfil' } },
        { path: 'usuarios',     component: UsuariosView,     meta: { module: 'usuarios' } },
        { path: 'uzdi',         component: ModuleView,       meta: { module: 'uzdi' } },
        { path: 'perfiles',     component: ModuleView,       meta: { module: 'perfiles' } },
        { path: 'permisos',     component: PermisosView,     meta: { module: 'permisos' } },
        { path: 'parametros',   component: ParametrosView,   meta: { module: 'parametros' } },
        { path: 'bitacora',     component: BitacoraView,     meta: { module: 'bitacora' } },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
})

router.beforeEach((to) => {
  const token = localStorage.getItem('uzdi_token')
  const isLoggedIn = !!token

  if (to.path.startsWith('/app') && !isLoggedIn) return '/login'
  if (to.path === '/login' && isLoggedIn) return '/app/dashboard'

  if (!isLoggedIn) return

  let user: Record<string, unknown> | null = null
  try {
    user = JSON.parse(localStorage.getItem('uzdi_user') ?? 'null') as Record<string, unknown> | null
  } catch {
    user = null
  }

  const tppr = user?.['tppr_id'] as number | undefined
  const module = to.meta.module as ModuleId | undefined
  if (!module) return
  if (!moduloDisponibleEnBackend(module)) {
    useToast().info('Este módulo todavía no está disponible en el backend institucional.')
    return '/app/dashboard'
  }
  if (!canAccess(module, tppr, permisosVigentes(tppr))) {
    useToast().info('No tiene permiso para acceder a ese módulo.')
    return '/app/dashboard'
  }
})

export default router
