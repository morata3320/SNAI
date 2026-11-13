import { ref } from 'vue'
import { useToast } from './useToast'
import {
  catalogoService,
  type CatalogoItem,
  type CantonItem,
  type ProvinciaItem,
  type UzdiItem,
  type InfraccionItem,
  type MedidaItem,
} from '../services/catalogo.service'

// Estado global compartido: los catálogos se cargan una sola vez por sesión.
const nacionalidades = ref<CatalogoItem[]>([])
const estadosCiviles = ref<CatalogoItem[]>([])
const etnias = ref<CatalogoItem[]>([])
const gdos = ref<CatalogoItem[]>([])
const cantones = ref<CantonItem[]>([])
const provincias = ref<ProvinciaItem[]>([])
const uzdis = ref<UzdiItem[]>([])
const infracciones = ref<InfraccionItem[]>([])
const medidas = ref<MedidaItem[]>([])
const catalogosConError = ref<string[]>([])
let cargado = false

export function useCatalogos() {
  async function cargarCatalogos(force = false) {
    if (cargado && !force) return
    const solicitudes = [
      ['Nacionalidades', catalogoService.nacionalidades, nacionalidades],
      ['Estados civiles', catalogoService.estadosCiviles, estadosCiviles],
      ['Etnias', catalogoService.etnias, etnias],
      ['GDO', catalogoService.gdos, gdos],
      ['Cantones', catalogoService.cantones, cantones],
      ['Provincias', catalogoService.provincias, provincias],
      ['UZDI', catalogoService.uzdis, uzdis],
      ['Infracciones', catalogoService.infracciones, infracciones],
      ['Medidas', catalogoService.medidas, medidas],
    ] as const
    const resultados = await Promise.allSettled(solicitudes.map(([, request]) => request()))
    const fallidos: string[] = []
    resultados.forEach((resultado, index) => {
      const [nombre, , destino] = solicitudes[index]!
      if (resultado.status === 'fulfilled') {
        // Cada catálogo tiene un Ref de Vue; la colección satisface su tipo propio.
        ;(destino as { value: unknown }).value = resultado.value
      } else {
        fallidos.push(nombre)
      }
    })
    catalogosConError.value = fallidos
    if (fallidos.length) {
      useToast().info(`No se pudieron cargar algunos catálogos: ${fallidos.join(', ')}.`)
    }
    cargado = true
  }

  return {
    nacionalidades,
    estadosCiviles,
    etnias,
    gdos,
    cantones,
    provincias,
    uzdis,
    infracciones,
    medidas,
    cargarCatalogos,
    catalogosConError,
  }
}
