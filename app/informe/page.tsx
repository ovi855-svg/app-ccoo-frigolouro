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

      // Convertir imagen a Base64 para el PDF
      const img = new Image()
      img.src = '/logo.png'
      
      // Esperar a que la imagen cargue si no está en caché (promesa simple)
      await new Promise((resolve) => {
        if (img.complete) resolve(true);
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
      });

      // Añadir Logo 
      doc.addImage(img, 'PNG', 14, 10, 25, 25)

      // Título y Cabecera (ajustados a la derecha del logo)
      doc.setFontSize(16)
      doc.text('Informe de Incidencias', 50, 20)
      doc.setFontSize(12)
      doc.text('Sección Sindical CCOO Frigolouro', 50, 28)
      
      // Separador
      doc.setLineWidth(0.5)
      doc.line(14, 40, 196, 40)

      // Info fecha
      doc.setFontSize(10)
      doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}` , 14, 48)
      doc.text(`Rango: ${new Date(startDate).toLocaleDateString('es-ES')} a ${new Date(endDate).toLocaleDateString('es-ES')}`, 14, 54)
      if (filterSeccion !== 'TODAS') {
        doc.text(`Sección: ${filterSeccion}`, 14, 60)
      }

      let yPos = filterSeccion !== 'TODAS' ? 70 : 64

      // Resumen por estado
      const stats = incidencias.reduce((acc: any, curr: any) => {
        acc[curr.estado] = (acc[curr.estado] || 0) + 1
        return acc
      }, {})

      const statsBody = Object.entries(stats).map(([estado, count]) => [estado, count])
      
      doc.setFontSize(12)
      doc.text('Resumen:', 14, yPos)
      
      // Tabla de Resumen (Mantenemos esta pequeña tabla)
      ;(autoTable as any)(doc, {
        startY: yPos + 5,
        head: [['Estado', 'Cantidad']],
        body: statsBody,
        theme: 'plain',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [220, 38, 38], textColor: 255 }, // Rojo CCOO aprox
        margin: { left: 14 }
      })

      const finalY = (doc as any).lastAutoTable?.finalY || yPos + 20
      yPos = finalY + 15

      // Detalle de Incidencias (Lista customizada)
      doc.setFontSize(14)
      doc.text('Detalle de Incidencias:', 14, yPos)
      yPos += 10

      doc.setFontSize(10)

      incidencias.forEach((inc: any, index: number) => {
        // Verificar si cabe en la página, si no, nueva página
        if (yPos > 270) {
            doc.addPage()
            yPos = 20
        }

        const fecha = new Date(inc.created_at).toLocaleDateString('es-ES')
        
        // Línea 1: Fecha y Sección
        doc.setFont(undefined, 'bold')
        doc.text(`Fecha: ${fecha}`, 14, yPos)
        doc.text(`Sección: ${inc.seccion}`, 100, yPos)
        
        yPos += 6
        
        // Línea 2: Título
        doc.text(`Título:`, 14, yPos)
        doc.setFont(undefined, 'normal')
        doc.text(`${inc.titulo}`, 30, yPos)
        
        yPos += 6
        
        // Línea 3: Descripción (Multilínea)
        if (inc.descripcion) {
            doc.setFont(undefined, 'bold')
            doc.text(`Descripción:`, 14, yPos)
            doc.setFont(undefined, 'normal')
            
            const splitDesc = doc.splitTextToSize(inc.descripcion, 150)
            doc.text(splitDesc, 40, yPos) // Indentado
            yPos += (splitDesc.length * 5)
        } 

        // Separador visual
        yPos += 5
        doc.setDrawColor(200, 200, 200)
        doc.line(14, yPos, 196, yPos)
        yPos += 10
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
