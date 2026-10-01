import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Afiliado } from './types'
import { AFFILIATION_FIELDS, displayField } from './affiliation'

export function affiliationPDF(person: Afiliado) {
  const doc = new jsPDF()
  doc.setFontSize(18)
  doc.setTextColor(185, 28, 28)
  doc.text('Ficha de afiliación', 14, 20)
  doc.setFontSize(11)
  doc.setTextColor(0)
  doc.text('Sección Sindical CCOO Frigolouro', 14, 28)
  const rows = [['Nombre completo', person.nombre_completo], ['Sección', person.seccion],
    ['Afiliación', person.estado_afiliacion === 'baja' ? 'Baja' : 'Activa'],
    ...AFFILIATION_FIELDS.map(([key, label]) => [label, displayField(person, key).replace(/—/g,'-')])]
  if (!person.telefono_movil && !person.telefono_fijo && person.telefono) rows.push(['Teléfono de la ficha anterior',person.telefono])
  if (person.estado_afiliacion === 'baja') {
    rows.push(['Motivo', person.motivo_baja || 'Sin dato'])
    if (person.ausencia_detectada_en) rows.push(['Ausencia detectada (no fecha efectiva de baja)', new Date(person.ausencia_detectada_en).toLocaleDateString('es-ES')])
  }
  autoTable(doc, { startY: 36, body: rows, theme: 'striped', styles: { fontSize: 10, cellPadding: 3, overflow: 'linebreak' }, columnStyles: { 0: { cellWidth: 65 } } })
  if (person.gestiones_afiliados?.length) {
    doc.addPage()
    doc.setFontSize(14)
    doc.text('Historial de gestiones', 14, 20)
    autoTable(doc, { startY: 28, head: [['Fecha', 'Gestión']], body: [...person.gestiones_afiliados].sort((a,b)=>b.created_at.localeCompare(a.created_at)).map(g=>[new Date(g.created_at).toLocaleDateString('es-ES'),g.gestion]), styles: { fontSize: 10, overflow: 'linebreak' }, columnStyles: { 0: { cellWidth: 30 } } })
  }
  return doc
}
