'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { SECCIONES } from '@/lib/constants'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function MetodosInformeGenerator() {
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

            // Query a Supabase - Tabla 'metodos_items'
            let query = supabase
                .from('metodos_items')
                .select('*, metodos_historial(*)')
                .gte('created_at', `${startDate}T00:00:00`)
                .lte('created_at', `${endDate}T23:59:59`)
                .order('created_at', { ascending: true })

            if (filterSeccion !== 'TODAS') {
                query = query.eq('seccion', filterSeccion)
            }

            const { data: rawData, error } = await query

            if (error) throw error

            // Procesar datos
            const items = (rawData as any[] || []).map(inc => ({
                ...inc,
                historial_cambios: inc.metodos_historial
                    ? inc.metodos_historial.sort((a: any, b: any) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )
                    : []
            }))

            if (!items || items.length === 0) {
                alert('No hay solicitudes para generar el informe en este rango.')
                return
            }

            // Generar PDF
            const doc = new jsPDF()

            try {
                const logoUrl = '/logo.png'
                const img = new Image()
                img.src = logoUrl
                await new Promise((resolve, reject) => {
                    img.onload = resolve
                    img.onerror = reject
                })
                doc.addImage(img, 'PNG', 14, 10, 30, 30)
            } catch (e) {
                console.warn('No se pudo cargar el logo', e)
            }

            doc.setFontSize(20)
            doc.setTextColor(220, 38, 38)
            doc.text('Informe de Métodos y Tiempos', 50, 22)

            doc.setFontSize(12)
            doc.setTextColor(0)
            doc.text('Sección Sindical CCOO Frigolouro', 50, 30)

            doc.setLineWidth(0.5)
            doc.setDrawColor(200, 200, 200)
            doc.line(14, 45, 196, 45)

            doc.setFontSize(10)
            doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 14, 55)
            doc.text(`Rango: ${new Date(startDate).toLocaleDateString('es-ES')} a ${new Date(endDate).toLocaleDateString('es-ES')}`, 14, 61)

            let yPos = 71
            if (filterSeccion !== 'TODAS') {
                doc.text(`Sección filtrada: ${filterSeccion}`, 14, 67)
                yPos = 77
            }

            const stats = items.reduce((acc: any, curr: any) => {
                acc[curr.estado] = (acc[curr.estado] || 0) + 1
                return acc
            }, {})

            const statsBody = Object.entries(stats).map(([estado, count]) => [estado, count])

            doc.setFontSize(14)
            doc.text('Resumen:', 14, yPos)

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

            let currentY = finalY + 15
            doc.setFontSize(14)
            doc.setTextColor(0)
            doc.text('Detalle de Solicitudes:', 14, currentY)
            currentY += 10

            doc.setFontSize(10)

            items.forEach((item: any) => {
                const fecha = new Date(item.created_at).toLocaleDateString('es-ES')
                const titulo = item.titulo || '-'
                const seccion = item.seccion || '-'
                const descripcion = item.descripcion || 'Sin descripción'

                const descLines = doc.splitTextToSize(descripcion, 180)
                const descHeight = descLines.length * 5
                const itemHeight = 35 + descHeight

                if (currentY + itemHeight > 280) {
                    doc.addPage()
                    currentY = 20
                }

                doc.setFont('helvetica', 'bold')
                doc.text(`Fecha:`, 14, currentY)
                doc.setFont('helvetica', 'normal')
                doc.text(fecha, 30, currentY)

                doc.setFont('helvetica', 'bold')
                doc.text(`Sección:`, 80, currentY)
                doc.setFont('helvetica', 'normal')
                doc.text(seccion, 100, currentY)
                currentY += 7

                doc.setFont('helvetica', 'bold')
                doc.text(`Título:`, 14, currentY)
                doc.setFont('helvetica', 'normal')
                doc.text(titulo, 30, currentY)
                currentY += 7

                doc.setFont('helvetica', 'bold')
                doc.text(`Descripción:`, 14, currentY)
                currentY += 5
                doc.setFont('helvetica', 'normal')
                doc.text(descLines, 14, currentY)
                currentY += descHeight + 5

                doc.setFont('helvetica', 'bold')
                doc.text(`Estado Actual:`, 14, currentY)
                doc.setFont('helvetica', 'normal')
                doc.text(item.estado, 45, currentY)
                currentY += 7

                if (item.historial_cambios && item.historial_cambios.length > 0) {
                    doc.setFont('helvetica', 'bold')
                    doc.text(`Historial de Cambios:`, 14, currentY)
                    currentY += 5

                    doc.setFont('helvetica', 'normal')
                    item.historial_cambios.forEach((cambio: any) => {
                        if (currentY + 5 > 280) {
                            doc.addPage()
                            currentY = 20
                        }
                        const fechaCambio = new Date(cambio.created_at).toLocaleString('es-ES')
                        doc.text(`- ${fechaCambio}: ${cambio.nuevo_estado}`, 20, currentY)
                        currentY += 5
                    })
                    currentY += 2
                }

                doc.setDrawColor(220, 220, 220)
                doc.line(14, currentY, 196, currentY)
                currentY += 10
            })

            doc.save(`informe_metodos_${new Date().toISOString().split('T')[0]}.pdf`)

        } catch (err) {
            console.error('Error generando PDF:', err)
            alert('Error al generar el PDF')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="form-container" style={{ maxWidth: '600px', margin: '20px auto' }}>
            <h2 style={{
                marginTop: 0,
                marginBottom: '25px',
                fontSize: '1.5rem',
                color: '#1e293b',
                fontWeight: 700
            }}>
                Generar Informe (Métodos)
            </h2>

            <div className="grid-two-columns">
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569' }}>Fecha Inicio</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            outline: 'none'
                        }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569' }}>Fecha Fin</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569' }}>Filtrar por Sección</label>
                <select
                    value={filterSeccion}
                    onChange={(e) => setFilterSeccion(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        backgroundColor: 'white',
                        outline: 'none'
                    }}
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
                    padding: '14px',
                    backgroundColor: 'var(--ccoo-red)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1.05rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.2)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                }}
            >
                {loading ? (
                    <span>Generando...</span>
                ) : (
                    <>
                        <span>Descargar Informe PDF</span>
                    </>
                )}
            </button>
        </div>
    )
}
