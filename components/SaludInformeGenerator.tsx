'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { SECCIONES, ESTADOS_SALUD } from '@/lib/constants'

export default function SaludInformeGenerator() {
    const [loading, setLoading] = useState(false)
    const [startDate, setStartDate] = useState(() => {
        const d = new Date()
        d.setDate(d.getDate() - 30) // Últimos 30 días
        return d.toISOString().split('T')[0]
    })
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
    const [filterSeccion, setFilterSeccion] = useState('TODAS')
    const [filterEstado, setFilterEstado] = useState('TODAS')
    const supabase = createClient()

    const generatePDF = async () => {
        try {
            setLoading(true)

            // Query a Supabase
            let query = supabase
                .from('salud_laboral')
                .select('*, historial_salud(*)')
                .gte('created_at', `${startDate}T00:00:00`)
                .lte('created_at', `${endDate}T23:59:59`)
                .order('created_at', { ascending: true })

            if (filterSeccion !== 'TODAS') {
                query = query.eq('seccion', filterSeccion)
            }
            if (filterEstado !== 'TODAS') {
                query = query.eq('estado', filterEstado)
            }

            const { data: rawData, error } = await query

            if (error) throw error

            // Procesar datos para ordenar historial
            const items = (rawData as any[] || []).map(item => ({
                ...item,
                historial_salud: item.historial_salud
                    ? item.historial_salud.sort((a: any, b: any) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )
                    : []
            }))

            if (!items || items.length === 0) {
                alert('No hay datos para generar el informe en este rango.')
                return
            }

            const {managementReport,loadReportBrand} = await import('@/lib/pdf-report')
            const records = items.map(record => ({...record,history:(record.historial_salud || []).map((h: any) => ({created_at:h.created_at,label:['Contestación Actualizada','Contestación de la Empresa'].includes(h.cambio)?'Contestación de la empresa actualizada':h.cambio,created_by_name:h.created_by_name}))}))
            const doc = managementReport(records, {title:'Informe de salud laboral',startDate,endDate,section:filterSeccion,state:filterEstado}, await loadReportBrand())
            doc.save(`informe_salud_laboral_${new Date().toISOString().split('T')[0]}.pdf`)

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
                Generar Informe Salud Laboral
            </h2>

            <div className="grid-two-columns">
                <div>
                    <label htmlFor="fecha-inicio" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569' }}>Fecha Inicio</label>
                    <input id="fecha-inicio"
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
                    <label htmlFor="fecha-fin" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569' }}>Fecha Fin</label>
                    <input id="fecha-fin"
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

            <div className="grid-two-columns">
                <div>
                    <label htmlFor="seccion-informe" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569' }}>Filtrar por Sección</label>
                    <select id="seccion-informe"
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
                <div>
                    <label htmlFor="estado-informe" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569' }}>Filtrar por Estado</label>
                    <select id="estado-informe"
                        value={filterEstado}
                        onChange={(e) => setFilterEstado(e.target.value)}
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
                        {ESTADOS_SALUD.map(est => (
                            <option key={est} value={est}>{est}</option>
                        ))}
                    </select>
                </div>
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
