'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { SECCIONES, ESTADOS } from '@/lib/constants'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function InformePage() {
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30) // Últimos 30 días
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
  const [filterSeccion, setFilterSeccion] = useState('TODAS')
  const supabase = createClient()

  const generatePDF = async () => {
    try {
      setLoading(true)

      // Query a Supabase
      let query = supabase
        .from('incidencias')
        .select('*')
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: true })

      if (filterSeccion !== 'TODAS') {
        query = query.eq('seccion', filterSeccion)
      }

      const { data: incidencias, error } = await query

      if (error) throw error
      if (!incidencias || incidencias.length === 0) {
        alert('No hay datos para generar el informe en este rango.')
        return
      }

      // Generar PDF
      const doc = new jsPDF()

      // Título
      doc.setFontSize(18)
      doc.text('Informe de Incidencias – Sección Sindical CCOO Frigolouro', 14, 20)
      
      // Info fecha
      doc.setFontSize(11)
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 14, 30)
      doc.text(`Rango: ${new Date(startDate).toLocaleDateString('es-ES')} a ${new Date(endDate).toLocaleDateString('es-ES')}`, 14, 36)
      if (filterSeccion !== 'TODAS') {
        doc.text(`Sección: ${filterSeccion}`, 14, 42)
      }

      // Resumen por estado
      const stats = incidencias.reduce((acc: any, curr: any) => {
        acc[curr.estado] = (acc[curr.estado] || 0) + 1
        return acc
      }, {})

      const statsBody = Object.entries(stats).map(([estado, count]) => [estado, count])
      
      doc.text('Resumen:', 14, 55);
      
      // Uso explícito de any para evitar problemas de tipos con jspdf-autotable
      (autoTable as any)(doc, {
        startY: 60,
        head: [['Estado', 'Cantidad']],
        body: statsBody,
        theme: 'plain',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [200, 200, 200], textColor: 0 }
      })

      // Tabla detallada
      const tableBody = incidencias.map((inc: any) => [
        new Date(inc.created_at).toLocaleDateString('es-ES'),
        inc.titulo,
        inc.seccion,
        inc.estado,
        inc.creada_por || '-'
      ])

      const finalY = (doc as any).lastAutoTable?.finalY || 60

      doc.text('Detalle de Incidencias:', 14, finalY + 15);

      (autoTable as any)(doc, {
        startY: finalY + 20,
        head: [['Fecha', 'Título', 'Sección', 'Estado', 'Creada por']],
        body: tableBody,
        theme: 'striped',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 } 
      })

      doc.save(`informe_incidencias_${new Date().toISOString().split('T')[0]}.pdf`)

    } catch (err) {
      console.error('Error generando PDF:', err)
      alert('Error al generar el PDF')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <h1>Informe PDF</h1>
      
      <div style={{ 
        maxWidth: '600px', 
        padding: '20px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px', 
        marginTop: '20px' 
      }}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Fecha Inicio</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Fecha Fin</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Filtrar por Sección</label>
          <select 
            value={filterSeccion}
            onChange={(e) => setFilterSeccion(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="TODAS">TODAS</option>
            {SECCIONES.map(sec => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={generatePDF}
          disabled={loading}
          style={{ 
            width: '100%',
            padding: '12px', 
            backgroundColor: '#0070f3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Generando PDF...' : 'Descargar Informe PDF'}
        </button>

      </div>
    </main>
  )
}
