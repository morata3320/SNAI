import { computed } from 'vue'
import { useAuth } from './useAuth'
import { useCatalogos } from './useCatalogos'

interface ConUzdi {
  uzdi_id?: number | null
}

/**
 * Alcance por UZDI (RF-02, RF-03, RF-11, RNF-05):
 * el Superadministrador ve todas las unidades; el resto solo la propia.
 */
export function useAlcance() {
  const { user } = useAuth()
  const { uzdis } = useCatalogos()

  const tppr = computed(() => (user.value?.['tppr_id'] as number) ?? 5)
  const uzdiId = computed<number | null>(() => {
    const id = user.value?.['uzdi_id']
    return typeof id === 'number' ? id : null
  })
  const esGlobal = computed(() => tppr.value === 4)
  const uzdiActual = computed(() => uzdis.value.find((u) => u.id === uzdiId.value) ?? null)

  function puedeVerUzdi(id: number | null | undefined): boolean {
    if (esGlobal.value) return true
    if (id === null || id === undefined) return false
    return id === uzdiId.value
  }

  function filtrarPorUzdi<T extends ConUzdi>(rows: T[]): T[] {
    if (esGlobal.value) return rows
    return rows.filter((row) => puedeVerUzdi(row.uzdi_id))
  }

  return { uzdiId, uzdiActual, esGlobal, puedeVerUzdi, filtrarPorUzdi }
}
