import { computed, ref, watch } from 'vue'
import type { CrudService } from '../services/crud.service'
import { useToast } from './useToast'
import { mensajeErrorApi } from '../services/response'

export type CrudModal = 'new' | 'edit' | 'delete' | null

export interface UseCrudOptions<T, P> {
  /** Cantidad de filas por página. */
  pageSize?: number
  /** Campos visibles usados por el buscador. */
  searchKeys: (keyof T)[]
  /** Formulario vacío para «Nuevo». */
  emptyForm: () => Partial<P>
  /** Convierte una fila del listado al formulario de edición. */
  toForm?: (row: T) => Partial<P>
  /** Texto que identifica a la fila (para confirmaciones). */
  nombre?: (row: T) => string
  /** Búsqueda personalizada; por defecto busca en `searchKeys`. */
  filter?: (row: T, q: string) => boolean
  /** Nombre del registro en singular, en minúsculas: «medida», «taller»… */
  etiqueta: string
}

export function mensajeDeError(error: unknown, respaldo: string): string {
  return mensajeErrorApi(error, respaldo)
}

/**
 * Estado compartido para los listados CRUD: carga, búsqueda, paginación,
 * formulario y baja lógica. La baja nunca elimina: llama a `deactivate`.
 */
export function useCrud<T extends { id: number }, P extends object>(
  service: CrudService<T, P>,
  options: UseCrudOptions<T, P>,
) {
  const toast = useToast()
  const pageSize = options.pageSize ?? 8

  const rows = ref<T[]>([]) as { value: T[] }
  const cargando = ref(false)
  const error = ref<string | null>(null)
  const search = ref('')
  const page = ref(1)
  const modal = ref<CrudModal>(null)
  const selected = ref<T | null>(null)
  const form = ref<Partial<P>>(options.emptyForm())
  const guardando = ref(false)

  async function recargar(): Promise<void> {
    cargando.value = true
    error.value = null
    try {
      rows.value = await service.getAll()
    } catch (e) {
      error.value = mensajeDeError(e, 'No se pudieron cargar los registros.')
      toast.error(error.value)
    } finally {
      cargando.value = false
    }
  }

  const filtered = computed(() => {
    const q = search.value.trim().toLowerCase()
    if (!q) return rows.value
    if (options.filter) return rows.value.filter((row) => options.filter!(row, q))
    return rows.value.filter((row) =>
      options.searchKeys.some((key) => String(row[key] ?? '').toLowerCase().includes(q)),
    )
  })

  const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
  const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))

  watch(filtered, () => {
    if (page.value > totalPages.value) page.value = totalPages.value
  })

  function onSearchInput(): void {
    page.value = 1
  }

  function openNew(initial?: Partial<P>): void {
    selected.value = null
    form.value = { ...options.emptyForm(), ...initial }
    modal.value = 'new'
  }

  function openEdit(row: T): void {
    selected.value = row
    form.value = options.toForm ? options.toForm(row) : ({ ...row } as unknown as Partial<P>)
    modal.value = 'edit'
  }

  function openDeactivate(row: T): void {
    selected.value = row
    modal.value = 'delete'
  }

  function cerrar(): void {
    modal.value = null
  }

  async function guardar(): Promise<boolean> {
    if (guardando.value) return false
    guardando.value = true
    try {
      if (modal.value === 'edit' && selected.value) {
        await service.update(selected.value.id, form.value as Partial<P>)
        toast.success(`Se actualizó ${options.etiqueta} correctamente.`)
      } else {
        await service.create(form.value as P)
        toast.success(`Se registró ${options.etiqueta} correctamente.`)
      }
      modal.value = null
      await recargar()
      return true
    } catch (e) {
      toast.error(mensajeDeError(e, `No se pudo guardar ${options.etiqueta}. Intente nuevamente.`))
      return false
    } finally {
      guardando.value = false
    }
  }

  async function desactivar(): Promise<boolean> {
    if (!selected.value || guardando.value) return false
    guardando.value = true
    try {
      await service.deactivate(selected.value.id)
      toast.success(`Se desactivó ${options.etiqueta} y se conservó su historial.`)
      modal.value = null
      await recargar()
      return true
    } catch (e) {
      toast.error(mensajeDeError(e, `No se pudo desactivar ${options.etiqueta}. Intente nuevamente.`))
      return false
    } finally {
      guardando.value = false
    }
  }

  const nombreSeleccionado = computed(() =>
    selected.value && options.nombre ? options.nombre(selected.value) : '',
  )

  return {
    rows,
    cargando,
    error,
    search,
    page,
    pageSize,
    filtered,
    paged,
    totalPages,
    modal,
    selected,
    form,
    guardando,
    nombreSeleccionado,
    recargar,
    onSearchInput,
    openNew,
    openEdit,
    openDeactivate,
    cerrar,
    guardar,
    desactivar,
  }
}
