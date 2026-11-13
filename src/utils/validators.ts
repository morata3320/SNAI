// Validaciones comunes de formularios (RNF-10).
// Todo mensaje está en español y se muestra junto al campo.

/** Cédula ecuatoriana: 10 dígitos, provincia 01–24 (o 30), tercer dígito < 6 y módulo 10. */
export function validarCedulaEC(cedula: string): boolean {
  const valor = (cedula ?? '').trim()
  if (!/^\d{10}$/.test(valor)) return false

  const provincia = Number(valor.slice(0, 2))
  if (!((provincia >= 1 && provincia <= 24) || provincia === 30)) return false
  if (Number(valor[2]) >= 6) return false

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2]
  let suma = 0
  for (let i = 0; i < 9; i++) {
    let producto = Number(valor[i]) * coeficientes[i]
    if (producto > 9) producto -= 9
    suma += producto
  }
  const verificador = (10 - (suma % 10)) % 10
  return verificador === Number(valor[9])
}

export function validarEmail(valor: string): boolean {
  if (!valor) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor.trim())
}

/** Celular 09XXXXXXXX o fijo 0[2-7]XXXXXXX (7 dígitos). */
export function validarTelefonoEC(valor: string): boolean {
  const v = (valor ?? '').replace(/[\s-]/g, '')
  return /^09\d{8}$/.test(v) || /^0[2-7]\d{7}$/.test(v)
}

export function requerido(valor: unknown): boolean {
  if (valor === null || valor === undefined) return false
  if (typeof valor === 'string') return valor.trim().length > 0
  if (Array.isArray(valor)) return valor.length > 0
  return true
}

export function fechaFinNoAnterior(inicio: string, fin: string): boolean {
  if (!inicio || !fin) return true
  return fin >= inicio
}

export function fechaNoFutura(iso: string): boolean {
  if (!iso) return true
  return iso <= hoyISO()
}

export function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function calcularEdad(fechaNac?: string | null): number {
  if (!fechaNac) return 0
  const hoy = new Date()
  const nac = new Date(`${fechaNac.substring(0, 10)}T00:00:00`)
  if (Number.isNaN(nac.getTime())) return 0
  let edad = hoy.getFullYear() - nac.getFullYear()
  if (hoy.getMonth() < nac.getMonth() || (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) edad--
  return edad
}

export function formatFecha(iso?: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.substring(0, 10).split('-')
  return d && m && y ? `${d}/${m}/${y}` : '—'
}

export function formatFechaHora(iso?: string | null): string {
  if (!iso) return '—'
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return formatFecha(iso)
  return fecha.toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' })
}

/** Suma meses a una fecha ISO conservando el formato YYYY-MM-DD. */
export function sumarMeses(iso: string, meses: number): string {
  if (!iso) return ''
  const fecha = new Date(`${iso.substring(0, 10)}T00:00:00`)
  if (Number.isNaN(fecha.getTime())) return ''
  fecha.setMonth(fecha.getMonth() + meses)
  return fecha.toISOString().slice(0, 10)
}

/** Diferencia en días entre hoy y una fecha ISO (negativo = vencida). */
export function diasHasta(iso?: string | null): number {
  if (!iso) return 0
  const objetivo = new Date(`${iso.substring(0, 10)}T00:00:00`).getTime()
  const hoy = new Date(`${hoyISO()}T00:00:00`).getTime()
  return Math.round((objetivo - hoy) / 86_400_000)
}
