import type { Afiliado } from './types'

export const AFFILIATION_FIELDS = [
  ['dni', 'DNI/NIE', 'text'], ['apellidos', 'Apellidos', 'text'], ['nombre', 'Nombre', 'text'],
  ['via', 'Vía', 'text'], ['direccion', 'Dirección', 'text'], ['numero', 'Nº', 'text'],
  ['piso', 'Piso', 'text'], ['codigo_postal', 'C.P.', 'text'], ['localidad', 'Localidad', 'text'],
  ['fecha_nacimiento', 'Fecha de nacimiento', 'date'], ['pais', 'País', 'text'],
  ['categoria', 'Categoría', 'text'], ['estado_pago', 'Estado de pago', 'text'],
  ['telefono_fijo', 'Teléfono fijo', 'tel'], ['telefono_movil', 'Teléfono móvil', 'tel'],
  ['correo_electronico', 'Correo electrónico', 'email'],
] as const
export type AffiliationField = typeof AFFILIATION_FIELDS[number][0]
export type ImportRow = Record<AffiliationField, string | null>
export type ImportPreview = {
  total: number; altas: number; actualizadas: number; reactivadas: number; bajas: number; revision: string;
  conflictos: { documento: string; nombre: string; candidato_id?: string; documento_anterior?: string; seccion?: string; ambiguo?: boolean }[];
  entradas: { id: string | null; documento: string; nombre: string; accion: string }[];
  ausentes: { id: string; nombre: string; seccion: string }[];
}

export function normalizeDocument(value: string | null | undefined): string {
  let n = (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (/^\d{7,8}[A-Z]$/.test(n) || /^[XYZ]\d{7}[A-Z]$/.test(n)) n = n.slice(0, -1)
  if (/^\d{1,8}$/.test(n)) n = n.padStart(8, '0')
  return n
}
export function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}
function header(value: unknown): string {
  return normalizeText(String(value ?? '')).toUpperCase().replace(/[^A-Z0-9]/g, '')
}
function birthDate(value: unknown, row: number): string | null {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const s = String(value).trim()
  let iso: string
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) iso = s
  else {
    const match = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s)
    if (!match) throw new Error(`Fila ${row}: fecha de nacimiento no reconocida.`)
    iso = `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
  }
  const d = new Date(`${iso}T00:00:00Z`)
  if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== iso) throw new Error(`Fila ${row}: fecha de nacimiento inválida.`)
  return iso
}

// The full official list is required. Never silently skip malformed rows.
export function parseAffiliationRows(rows: unknown[][]): ImportRow[] {
  const expected = ['DNI/NIE', 'APELLIDOS', 'NOMBRE', 'VÍA', 'DIRECCIÓN', 'Nº', 'PISO', 'C.P.', 'LOCALIDAD', 'FECHA DE NACIMIENTO', 'PAÍS', 'CATEGORÍA', 'ESTADO', 'TELÉFONO FIJO', 'TELÉFONO MÓVIL', 'CORREO ELECTRÓNICO']
  if (!rows.length) throw new Error('El archivo está vacío.')
  const columns = rows[0].map(header)
  const indices = expected.map(label => {
    const matches = columns.flatMap((col, i) => col === header(label) ? [i] : [])
    if (matches.length !== 1) throw new Error(`Debe existir una sola columna «${label}».`)
    return matches[0]
  })
  const documents = new Set<string>()
  const result: ImportRow[] = []
  rows.slice(1).forEach((row, i) => {
    if (row.every(value => value === null || value === undefined || String(value).trim() === '')) return
    const record = {} as ImportRow
    AFFILIATION_FIELDS.forEach(([key], j) => {
      const value = row[indices[j]]
      record[key] = key === 'fecha_nacimiento' ? birthDate(value, i + 2) : value === null || value === undefined ? null : String(value).trim() || null
    })
    record.dni = (record.dni || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (!record.dni || !record.nombre || !record.apellidos) throw new Error(`Fila ${i + 2}: falta DNI/NIE, nombre o apellidos.`)
    const document = normalizeDocument(record.dni)
    if (documents.has(document)) throw new Error(`Fila ${i + 2}: documento repetido. No se ha importado nada.`)
    documents.add(document)
    if (record.codigo_postal && /^\d+$/.test(record.codigo_postal)) record.codigo_postal = record.codigo_postal.padStart(5, '0')
    result.push(record)
  })
  if (!result.length || result.length > 10000) throw new Error('El listado debe contener entre 1 y 10000 personas.')
  return result
}

export function paymentLabel(value: string | null | undefined): string {
  return value?.trim().toUpperCase() === 'AC' ? 'AC · Al corriente' : value || 'Sin dato'
}
export function displayField(person: Afiliado, key: AffiliationField): string {
  if (key === 'estado_pago') return paymentLabel(person[key])
  if (key === 'fecha_nacimiento' && person[key]) return person[key]!.split('-').reverse().join('/')
  return person[key] || '—'
}
