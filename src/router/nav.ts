// Menú lateral agrupado (AGENTS.md §0.1). El orden y los grupos son estables;
// AppShell oculta los ítems y grupos que el rol no puede ver.
import type { ModuleId } from './access'

export type NavIcon =
  | 'home' | 'user' | 'users' | 'folder' | 'scale' | 'heart' | 'clipboard'
  | 'book' | 'calendar' | 'check' | 'lock' | 'map' | 'list' | 'chart'
  | 'fileText' | 'settings' | 'shield' | 'key' | 'database' | 'file'

export interface NavItem {
  id: ModuleId
  to: string
  label: string
  icon: NavIcon
}

export interface NavGroup {
  group: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    group: 'General',
    items: [
      { id: 'dashboard', to: '/app/dashboard', label: 'Inicio', icon: 'home' },
      { id: 'perfil', to: '/app/perfil', label: 'Mi Perfil', icon: 'user' },
    ],
  },
  {
    group: 'Gestión',
    items: [
      { id: 'adolescentes', to: '/app/adolescentes', label: 'Adolescentes', icon: 'users' },
      { id: 'representantes', to: '/app/representantes', label: 'Representantes', icon: 'user' },
      { id: 'contexto-familiar', to: '/app/contexto-familiar', label: 'Contexto familiar', icon: 'heart' },
      { id: 'alertas-salud', to: '/app/alertas-salud', label: 'Alertas de salud', icon: 'heart' },
      { id: 'fichas', to: '/app/fichas', label: 'Fichas psicológicas', icon: 'clipboard' },
      { id: 'educacion', to: '/app/educacion', label: 'Información educativa', icon: 'book' },
      { id: 'talleres', to: '/app/talleres', label: 'Talleres', icon: 'calendar' },
      { id: 'asistencia-talleres', to: '/app/asistencia-talleres', label: 'Asistencia a talleres', icon: 'check' },
      { id: 'expedientes', to: '/app/expedientes', label: 'Expedientes', icon: 'folder' },
      { id: 'medidas', to: '/app/medidas', label: 'Medidas', icon: 'scale' },
      { id: 'documentos', to: '/app/documentos', label: 'Documentos', icon: 'fileText' },
      { id: 'gdos', to: '/app/gdos', label: 'GDO', icon: 'shield' },
      { id: 'asignacion-casos', to: '/app/asignacion-casos', label: 'Asignación de casos', icon: 'list' },
    ],
  },
  {
    group: 'Análisis',
    items: [
      { id: 'reportes', to: '/app/reportes', label: 'Reportes', icon: 'chart' },
      { id: 'informes', to: '/app/informes', label: 'Informe técnico', icon: 'fileText' },
    ],
  },
  {
    group: 'Configuración',
    items: [
      { id: 'usuarios', to: '/app/usuarios', label: 'Usuarios', icon: 'users' },
      { id: 'uzdi', to: '/app/uzdi', label: 'UZDI', icon: 'map' },
      { id: 'perfiles', to: '/app/perfiles', label: 'Perfiles', icon: 'shield' },
      { id: 'permisos', to: '/app/permisos', label: 'Permisos', icon: 'key' },
      { id: 'parametros', to: '/app/parametros', label: 'Parámetros', icon: 'settings' },
      { id: 'catalogos', to: '/app/catalogos', label: 'Catálogos', icon: 'database' },
      { id: 'bitacora', to: '/app/bitacora', label: 'Bitácora', icon: 'lock' },
    ],
  },
]

export const ICONS: Record<NavIcon, string> = {
  home: '<path d="M3 9.5 12 3l9 6.5"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  folder: '<path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  scale: '<path d="M12 3v18"/><path d="M5 7h14"/><path d="m5 7-3 6h6l-3-6Z"/><path d="m19 7-3 6h6l-3-6Z"/><path d="M7 21h10"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>',
  clipboard: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6"/><path d="M9 16h6"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  check: '<path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  map: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 16V9"/><path d="M12 16V5"/><path d="M17 16v-7"/>',
  fileText: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h8"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
  key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m11 12 9-9"/><path d="m17 5 3 3"/><path d="m14 8 3 3"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
}

/** SVG completo con el estilo de los íconos existentes. */
export function navIcon(name: NavIcon): string {
  return `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`
}

/** Etiqueta del módulo para migas de pan. */
export function moduleLabel(path: string): string {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (path.startsWith(item.to)) return item.label
    }
  }
  return 'Inicio'
}
