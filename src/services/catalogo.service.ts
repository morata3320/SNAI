import api from './api'
import { listaDe } from './response'
import { ENDPOINTS } from './backend-contract'

// Catálogos normalizados del backend (cada uno expone { id, nombre, ... })
export interface CatalogoItem {
  id: number
  nombre: string
}

export interface ProvinciaItem extends CatalogoItem {
  activo?: boolean
}

export interface CantonItem extends CatalogoItem {
  provincia_id?: number
  activo?: boolean
}

export interface UzdiItem extends CatalogoItem {
  zona?: string
  cntn_id?: number
  provincia_id?: number
  activo?: boolean
}

export interface InfraccionItem extends CatalogoItem {
  categoria?: string
}

export interface MedidaItem extends CatalogoItem {
  duracion_meses?: number | null
  descripcion?: string
  activo?: boolean
}

async function fetchList<T>(path: string): Promise<T[]> {
  const { data } = await api.get<T[]>(path)
  return listaDe<T>(data)
}

export const catalogoService = {
  nacionalidades: () => fetchList<CatalogoItem>(ENDPOINTS.nacionalidad),
  estadosCiviles: () => fetchList<CatalogoItem>(ENDPOINTS.estadoCivil),
  etnias: () => fetchList<CatalogoItem>(ENDPOINTS.etnia),
  gdos: () => fetchList<CatalogoItem>(ENDPOINTS.gdo),
  cantones: () => fetchList<CantonItem>(ENDPOINTS.canton),
  provincias: () => fetchList<ProvinciaItem>(ENDPOINTS.provincia),
  uzdis: () => fetchList<UzdiItem>(ENDPOINTS.uzdi),
  infracciones: () => fetchList<InfraccionItem>(ENDPOINTS.infraccion),
  medidas: () => fetchList<MedidaItem>(ENDPOINTS.medidaSocioeducativa),
}
