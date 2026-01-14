'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

interface Incidencia {
    id: string
    created_at: string
    seccion: string
    titulo: string
    descripcion: string
    estado: string
    creada_por?: string
}

export default function IncidenciasPage() {
    const [incidencias, setIncidencias] = useState<Incidencia[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        async function fetchIncidencias() {
            try {
                const { data, error } = await supabase
                    .from('incidencias')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (error) {
                    console.error('Error cargando incidencias:', error)
                } else {
                    setIncidencias(data || [])
                }
            } catch (error) {
                console.error('Error inesperado:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchIncidencias()
    }, [supabase])

    if (loading) {
        return (
            <main>
                <h1>Listado de incidencias</h1>
                <p>Cargando...</p>
            </main>
        )
    }

    return (
        <main>
            <h1>Listado de incidencias</h1>
            
            {incidencias.length === 0 ? (
                <p style={{ marginTop: '20px', color: '#666' }}>No hay incidencias registradas.</p>
            ) : (
                <div style={{ display: 'grid', gap: '1rem', marginTop: '20px' }}>
                    {incidencias.map((incidencia) => (
                        <div
                            key={incidencia.id}
                            style={{
                                border: '1px solid #ddd',
                                padding: '1rem',
                                borderRadius: '8px',
                                backgroundColor: 'white',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                                <span>{new Date(incidencia.created_at).toLocaleDateString('es-ES')}</span>
                                <span style={{
                                    fontWeight: 'bold',
                                    color: incidencia.estado === 'abierta' ? '#d32f2f' : '#388e3c'
                                }}>
                                    {incidencia.estado.toUpperCase()}
                                </span>
                            </div>
                            
                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>{incidencia.titulo}</h3>
                            
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
                                <span style={{ backgroundColor: '#f5f5f5', padding: '2px 8px', borderRadius: '4px' }}>
                                    {incidencia.seccion}
                                </span>
                                {incidencia.creada_por && (
                                    <span style={{ color: '#666' }}>
                                        Por: {incidencia.creada_por}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    )
}