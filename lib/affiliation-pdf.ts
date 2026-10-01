import type {Afiliado} from './types'
import {affiliationRecord,loadReportBrand} from './pdf-report'
export async function affiliationPDF(person: Afiliado) {
  return affiliationRecord(person,await loadReportBrand())
}
