/**
 * Generador XLSX sin dependencias adicionales.
 * Los datos provienen de los listados autenticados del backend UZDI.
 * Crea un ZIP Office Open XML sin compresión (método STORE).
 */
export interface FilaInforme {
  numeroCausa: string
  estado: string
  uzdi: string
  infraccion: string
  medidas: string
  cumplimiento: string
}
export interface InformeXlsx {
  titulo: string
  zona: string
  periodo: string
  desde: string
  hasta: string
  indicadores: { indicador: string; valor: number }[]
  expedientes: FilaInforme[]
}

const MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'

function escapeXml(value: unknown): string {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function colName(index: number): string {
  let n = index + 1
  let name = ''
  while (n > 0) {
    n--
    name = String.fromCharCode(65 + (n % 26)) + name
    n = Math.floor(n / 26)
  }
  return name
}

function makeSheet(
  rows: (string | number | null)[][],
  headerRows: number[],
  widths: number[],
  mergeTitleTo?: string,
): string {
  const cols = widths.map((width, i) =>
    '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + width + '" customWidth="1"/>',
  ).join('')
  const rowXml = rows.map((values, index) => {
    const rowNum = index + 1
    const style = rowNum === 1 ? 2 : headerRows.includes(rowNum) ? 1 : 0
    const cells = values.map((value, i) => {
      if (value === null || value === '') return ''
      const attr = ' r="' + colName(i) + rowNum + '" s="' + style + '"'
      if (typeof value === 'number' && Number.isFinite(value)) {
        return '<c' + attr + '><v>' + value + '</v></c>'
      }
      return '<c' + attr + ' t="inlineStr"><is><t xml:space="preserve">' +
        escapeXml(value) + '</t></is></c>'
    }).join('')
    return '<row r="' + rowNum + '"' + (rowNum === 1 ? ' ht="32" customHeight="1"' : '') + '>' +
      cells + '</row>'
  }).join('')
  const merged = mergeTitleTo
    ? '<mergeCells count="1"><mergeCell ref="A1:' + mergeTitleTo + '1"/></mergeCells>'
    : ''
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="' + NS + '">' +
    '<sheetViews><sheetView workbookViewId="0"/></sheetViews>' +
    '<sheetFormatPr defaultRowHeight="17"/><cols>' + cols + '</cols><sheetData>' +
    rowXml + '</sheetData>' + merged + '</worksheet>'
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function put16(view: DataView, at: number, value: number): void {
  view.setUint16(at, value, true)
}
function put32(view: DataView, at: number, value: number): void {
  view.setUint32(at, value, true)
}

/** ZIP STORE, compatible con Excel y LibreOffice. */
function zipStore(files: Record<string, string>): Uint8Array {
  const encoder = new TextEncoder()
  const locals: Uint8Array[] = []
  const centrals: Uint8Array[] = []
  let offset = 0
  for (const [filename, value] of Object.entries(files)) {
    const name = encoder.encode(filename)
    const bytes = encoder.encode(value)
    const crc = crc32(bytes)
    const local = new Uint8Array(30 + name.length + bytes.length)
    const lv = new DataView(local.buffer)
    put32(lv, 0, 0x04034b50)
    put16(lv, 4, 20)
    put16(lv, 6, 0)
    put16(lv, 8, 0)
    put32(lv, 14, crc)
    put32(lv, 18, bytes.length)
    put32(lv, 22, bytes.length)
    put16(lv, 26, name.length)
    local.set(name, 30)
    local.set(bytes, 30 + name.length)
    locals.push(local)

    const central = new Uint8Array(46 + name.length)
    const cv = new DataView(central.buffer)
    put32(cv, 0, 0x02014b50)
    put16(cv, 4, 20)
    put16(cv, 6, 20)
    put16(cv, 8, 0)
    put16(cv, 10, 0)
    put32(cv, 16, crc)
    put32(cv, 20, bytes.length)
    put32(cv, 24, bytes.length)
    put16(cv, 28, name.length)
    put32(cv, 42, offset)
    central.set(name, 46)
    centrals.push(central)
    offset += local.length
  }
  const centralLength = centrals.reduce((sum, bytes) => sum + bytes.length, 0)
  const end = new Uint8Array(22)
  const ev = new DataView(end.buffer)
  put32(ev, 0, 0x06054b50)
  put16(ev, 8, centrals.length)
  put16(ev, 10, centrals.length)
  put32(ev, 12, centralLength)
  put32(ev, 16, offset)
  const all = [...locals, ...centrals, end]
  const total = all.reduce((sum, bytes) => sum + bytes.length, 0)
  const output = new Uint8Array(total)
  let pos = 0
  for (const piece of all) {
    output.set(piece, pos)
    pos += piece.length
  }
  return output
}

const styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<styleSheet xmlns="' + NS + '">' +
  '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font>' +
  '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>' +
  '<fills count="3"><fill><patternFill patternType="none"/></fill>' +
  '<fill><patternFill patternType="gray125"/></fill>' +
  '<fill><patternFill patternType="solid"><fgColor rgb="FF253C72"/><bgColor indexed="64"/></patternFill></fill></fills>' +
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>' +
  '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1"/>' +
  '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1"/></cellXfs>' +
  '</styleSheet>'

export function descargarInformeXlsx(informe: InformeXlsx): void {
  const resumen: (string | number | null)[][] = [
    ['SERVICIO NACIONAL DE ATENCIÓN INTEGRAL — UZDI/SNAI'],
    ['Informe', informe.titulo],
    ['Zona / UZDI', informe.zona],
    ['Período', informe.periodo],
    ['Fecha desde', informe.desde],
    ['Fecha hasta', informe.hasta],
    ['Generado', new Date().toLocaleString('es-EC')],
    ['Fuente', 'Consultas autenticadas a la API UZDI/SNAI'],
    [],
    ['Indicador', 'Cantidad'],
    ...informe.indicadores.map((fila) => [fila.indicador, fila.valor]),
  ]
  const expedientes: (string | number | null)[][] = [
    ['DETALLE OPERATIVO DE EXPEDIENTES — UZDI/SNAI'],
    ['N.º causa', 'Estado procesal', 'UZDI', 'Infracción', 'Medidas socioeducativas', 'Cumplimiento'],
    ...informe.expedientes.map((e) => [
      e.numeroCausa, e.estado, e.uzdi, e.infraccion, e.medidas, e.cumplimiento,
    ]),
  ]
  const files: Record<string, string> = {
    '[Content_Types].xml':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
      '</Types>',
    '_rels/.rels':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>',
    'xl/workbook.xml':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="' + NS + '" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheets><sheet name="Resumen" sheetId="1" r:id="rId1"/>' +
      '<sheet name="Expedientes" sheetId="2" r:id="rId2"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels':
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>' +
      '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      '</Relationships>',
    'xl/styles.xml': styles,
    'xl/worksheets/sheet1.xml': makeSheet(resumen, [10], [50, 35], 'B'),
    'xl/worksheets/sheet2.xml': makeSheet(expedientes, [2], [26, 22, 32, 32, 52, 24], 'F'),
  }
  const zip = zipStore(files)
  const blob = new Blob([zip.buffer as ArrayBuffer], { type: MIME })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'informe-uzdi-snai-' + new Date().toISOString().slice(0, 10) + '.xlsx'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
