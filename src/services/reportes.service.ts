import api from './api'
import { mensajeErrorApi } from './response'
import { ENDPOINTS } from './backend-contract'

export type FormatoInstitucional = 'excel' | 'pdf'

/** Estos endpoints están documentados en Swagger bajo Reportes. */
const URL_DESCARGAS: Record<FormatoInstitucional, string> = {
  excel: ENDPOINTS.reportes.excel,
  pdf: ENDPOINTS.reportes.pdf,
}

export interface FiltrosReporteInstitucional {
  uzdi_id?: number
  prov_id?: number
  cntn_id?: number
  estado_procesal?: 'En proceso' | 'Atraso' | 'Incomparecencia' | 'Concluido' | 'Archivado'
}

const FORMATO_ARCHIVO: Record<FormatoInstitucional, { mime: string; extension: string }> = {
  excel: {
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: 'xlsx',
  },
  pdf: { mime: 'application/pdf', extension: 'pdf' },
}

export const reportesService = {
  async descargarInstitucional(
    formato: FormatoInstitucional,
    filtros: FiltrosReporteInstitucional = {},
  ): Promise<void> {
    const { data, headers } = await api.get<Blob>(URL_DESCARGAS[formato], {
      params: filtros,
      responseType: 'blob',
    })
    const blob = data instanceof Blob ? data : new Blob([data], { type: FORMATO_ARCHIVO[formato].mime })

    // Algunos servidores devuelven un error JSON con un código HTTP 200.
    const tipo = String(headers['content-type'] ?? blob.type).toLowerCase()
    if (tipo.includes('application/json')) {
      try {
        const body = JSON.parse(await blob.text()) as { message?: string }
        throw new Error(body.message || 'El servidor no generó el archivo solicitado.')
      } catch (error) {
        throw new Error(mensajeErrorApi(error, error instanceof Error ? error.message : 'Error al descargar.'))
      }
    }

    if (blob.size === 0) throw new Error('El backend devolvió un archivo vacío.')
    const url = URL.createObjectURL(blob)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `reporte-snai-${new Date().toISOString().slice(0, 10)}.${FORMATO_ARCHIVO[formato].extension}`
    document.body.appendChild(enlace)
    enlace.click()
    enlace.remove()
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  },

  async resumenAdolescentes(filtros: FiltrosReporteInstitucional = {}): Promise<unknown> {
    const { data } = await api.get<unknown>(ENDPOINTS.reportes.adolescentes, { params: filtros })
    return data
  },

  async resumenExpedientes(filtros: FiltrosReporteInstitucional = {}): Promise<unknown> {
    const { data } = await api.get<unknown>(ENDPOINTS.reportes.expedientesMedidas, { params: filtros })
    return data
  },
}
