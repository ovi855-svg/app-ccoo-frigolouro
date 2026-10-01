'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { SECCIONES } from '@/lib/constants'
import { Afiliado } from '@/lib/types'

export default function AfiliadosInformeGenerator() {
    const [loading, setLoading] = useState(false)
    const [startDate, setStartDate] = useState(() => {
        const d = new Date()
        d.setFullYear(d.getFullYear() - 1) // Último año por defecto
        return d.toISOString().split('T')[0]
    })
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
    const [filterSeccion, setFilterSeccion] = useState('TODAS')
    const [filterEstado, setFilterEstado] = useState('activa')
    const supabase = createClient()

    const generatePDF = async () => {
        try {
            setLoading(true)

            // Query a Supabase
            let query = supabase
                .from('afiliados')
                .select('*, gestiones_afiliados(*)')
                .eq('estado_afiliacion', filterEstado)
                .gte('created_at', `${startDate}T00:00:00`)
                .lte('created_at', `${endDate}T23:59:59`)
                .order('seccion', { ascending: true })
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
                alert('No hay fichas de afiliación registradas en este rango de fechas y sección.')
                return
            }

            const {affiliationReport,loadReportBrand} = await import('@/lib/pdf-report')
            const doc = affiliationReport(afiliados, {title:'Informe de afiliación',startDate,endDate,section:filterSeccion,state:filterEstado==='baja'?'Bajas':'Activa'}, await loadReportBrand())
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
                Generar informe de afiliación
            </h2>

            <div className="grid-two-columns">
                <div>
                    <label htmlFor="fecha-inicio" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569' }}>Fecha Registro Inicio</label>
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
                    <label htmlFor="fecha-fin" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569' }}>Fecha Registro Fin</label>
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

            <div style={{ marginBottom: '20px' }}>
                <label htmlFor="informe-estado" style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Estado de afiliación</label>
                <select id="informe-estado" value={filterEstado} onChange={e=>setFilterEstado(e.target.value)} style={{ width: '100%', padding: '10px 12px', marginBottom: '20px', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                    <option value="activa">Afiliación activa</option>
                    <option value="baja">Bajas de afiliación</option>
                </select>
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
