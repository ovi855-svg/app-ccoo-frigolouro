'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { SECCIONES } from '@/lib/constants'
import { Afiliado } from '@/lib/types'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function AfiliadosInformeGenerator() {
    const [loading, setLoading] = useState(false)
    const [startDate, setStartDate] = useState(() => {
        const d = new Date()
        d.setFullYear(d.getFullYear() - 1) // Último año por defecto
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
                .from('afiliados')
                .select('*, gestiones_afiliados(*)')
                .gte('created_at', `${startDate}T00:00:00`)
                .lte('created_at', `${endDate}T23:59:59`)
                .order('nombre_completo', { ascending: true })

            if (filterSeccion !== 'TODAS') {
                query = query.eq('seccion', filterSeccion)
            }

            const { data: rawData, error } = await query

            if (error) throw error

            // Procesar datos
            const afiliados = (rawData as Afiliado[] || []).map(afiliado => ({
                ...afiliado,
                gestiones_afiliados: afiliado.gestiones_afiliados
                    ? afiliado.gestiones_afiliados.sort((a, b) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )
                    : []
            }))

            if (!afiliados || afiliados.length === 0) {
                alert('No hay afiliados registrados en este rango de fechas y sección.')
                return
            }

            // Generar PDF
            const doc = new jsPDF()

            // Intentar cargar logo
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

            // Título y Cabecera
            doc.setFontSize(20)
            doc.setTextColor(220, 38, 38) // Rojo CCOO
            doc.text('Informe de Afiliados', 50, 22)

            doc.setFontSize(12)
            doc.setTextColor(0) // Negro
            doc.text('Sección Sindical CCOO Frigolouro', 50, 30)

            // Separador
            doc.setLineWidth(0.5)
            doc.setDrawColor(200, 200, 200)
            doc.line(14, 45, 196, 45)

            // Info fecha
            doc.setFontSize(10)
            doc.text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, 14, 55)
            doc.text(`Registro entre: ${new Date(startDate).toLocaleDateString('es-ES')} a ${new Date(endDate).toLocaleDateString('es-ES')}`, 14, 61)

            let yPos = 71
            if (filterSeccion !== 'TODAS') {
                doc.text(`Sección filtrada: ${filterSeccion}`, 14, yPos)
                yPos += 6
            }
            // Resumen total
            doc.text(`Total Afiliados encontrados: ${afiliados.length}`, 14, yPos)
            yPos += 6

            // Resumen por sección
            const stats = afiliados.reduce((acc: any, curr: any) => {
                acc[curr.seccion] = (acc[curr.seccion] || 0) + 1
                return acc
            }, {})

            const statsBody = Object.entries(stats).map(([sec, count]) => [sec, count])

            doc.setFontSize(14)
            doc.text('Distribución por Sección:', 14, yPos + 6)

                // Tabla de Resumen
                ; (autoTable as any)(doc, {
                    startY: yPos + 10,
                    head: [['Sección', 'Cantidad']],
                    body: statsBody,
                    theme: 'striped',
                    styles: { fontSize: 10 },
                    headStyles: { fillColor: [60, 60, 60], textColor: 255 },
                    margin: { left: 14 },
                    tableWidth: 80
                })

            const finalY = (doc as any).lastAutoTable?.finalY || yPos + 30

            // Lista de Detalles
            let currentY = finalY + 15
            doc.setFontSize(14)
            doc.setTextColor(0)
            doc.text('Listado de Afiliados:', 14, currentY)
            currentY += 10

            doc.setFontSize(10)

            const tableBody = afiliados.map(af => [
                af.nombre_completo || 'Sin nombre',
                af.seccion || '-',
                af.telefono || '-'
            ])

                ; (autoTable as any)(doc, {
                    startY: currentY,
                    head: [['Nombre Completo', 'Sección', 'Teléfono']],
                    body: tableBody,
                    theme: 'striped',
                    styles: { fontSize: 9, cellPadding: 3 },
                    headStyles: { fillColor: [60, 60, 60], textColor: 255 },
                    columnStyles: {
                        0: { cellWidth: 90 }, // Nombre
                        1: { cellWidth: 50 }, // Sección
                        2: { cellWidth: 40 }  // Teléfono
                    },
                    margin: { left: 14, right: 14 }
                })

            doc.save(`informe_afiliados_${new Date().toISOString().split('T')[0]}.pdf`)

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
                Generar Informe de Afiliados
            </h2>

            <div className="grid-two-columns">
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569' }}>Fecha Registro Inicio</label>
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
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569' }}>Fecha Registro Fin</label>
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

            <div style={{ marginBottom: '20px' }}>
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
