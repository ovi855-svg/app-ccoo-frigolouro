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

            // Título y Cabecera
            doc.setFontSize(20)
            doc.setTextColor(220, 38, 38) // Rojo CCOO
            doc.text('Informe de Incidencias', 14, 22)

            doc.setFontSize(12)
            doc.setTextColor(0) // Negro
            doc.text('Sección Sindical CCOO Frigolouro', 14, 30)

            // Separador
            doc.setLineWidth(0.5)
            doc.setDrawColor(200, 200, 200)
            doc.line(14, 36, 196, 36)

            // Info fecha
            doc.setFontSize(10)
            doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 14, 46)
            doc.text(`Rango: ${new Date(startDate).toLocaleDateString('es-ES')} a ${new Date(endDate).toLocaleDateString('es-ES')}`, 14, 52)

            let yPos = 62
            if (filterSeccion !== 'TODAS') {
                doc.text(`Sección filtrada: ${filterSeccion}`, 14, 58)
                yPos = 68
            }

            // Resumen por estado
            const stats = incidencias.reduce((acc: any, curr: any) => {
                acc[curr.estado] = (acc[curr.estado] || 0) + 1
                return acc
            }, {})

            const statsBody = Object.entries(stats).map(([estado, count]) => [estado, count])

            doc.setFontSize(14)
            doc.text('Resumen:', 14, yPos)

            // Tabla de Resumen
            ; (autoTable as any)(doc, {
                startY: yPos + 5,
                head: [['Estado', 'Cantidad']],
                body: statsBody,
                theme: 'striped',
                styles: { fontSize: 10 },
                headStyles: { fillColor: [60, 60, 60], textColor: 255 },
                margin: { left: 14 },
                tableWidth: 80
            })

            const finalY = (doc as any).lastAutoTable?.finalY || yPos + 20

            // Lista de Detalles
            let currentY = finalY + 15
            doc.setFontSize(14)
            doc.setTextColor(0)
            doc.text('Detalle de Incidencias:', 14, currentY)
            currentY += 10

            doc.setFontSize(10)

            incidencias.forEach((inc: any) => {
                const fecha = new Date(inc.created_at).toLocaleDateString('es-ES')
                const titulo = inc.titulo || '-'
                const seccion = inc.seccion || '-'
                const descripcion = inc.descripcion || 'Sin descripción'

                // Calcular altura de la descripción para ver si cabe
                const descLines = doc.splitTextToSize(descripcion, 180) 
                const descHeight = descLines.length * 5
                const itemHeight = 35 + descHeight // Altura estimada del bloque

                // Nueva página si no cabe
                if (currentY + itemHeight > 280) {
                    doc.addPage()
                    currentY = 20
                }

                // Fila 1: Fecha y Sección
                doc.setFont(undefined, 'bold')
                doc.text(`Fecha:`, 14, currentY)
                doc.setFont(undefined, 'normal')
                doc.text(fecha, 30, currentY)

                doc.setFont(undefined, 'bold')
                doc.text(`Sección:`, 80, currentY)
                doc.setFont(undefined, 'normal')
                doc.text(seccion, 100, currentY)
                
                currentY += 7

                // Fila 2: Título
                doc.setFont(undefined, 'bold')
                doc.text(`Título:`, 14, currentY)
                doc.setFont(undefined, 'normal')
                doc.text(titulo, 30, currentY)
                
                currentY += 7

                // Fila 3: Descripción
                doc.setFont(undefined, 'bold')
                doc.text(`Descripción:`, 14, currentY)
                currentY += 5
                
                doc.setFont(undefined, 'normal')
                doc.text(descLines, 14, currentY)
                
                currentY += descHeight + 5

                // Línea separadora
                doc.setDrawColor(220, 220, 220)
                doc.line(14, currentY, 196, currentY)
                currentY += 10
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
