'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Incidencia } from '@/lib/types'
import { SECCIONES, ESTADOS_INCIDENCIAS } from '@/lib/constants'

export default function IncidenciasManager() {
    const [incidencias, setIncidencias] = useState<Incidencia[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Filtros
    const [filterSeccion, setFilterSeccion] = useState('TODAS')
    const [filterEstado, setFilterEstado] = useState('TODOS')
    const [filterTexto, setFilterTexto] = useState('')

    const supabase = createClient()

    const fetchIncidencias = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('incidencias')
                .select('*, historial_cambios(*)')
                .order('created_at', { ascending: false })

            if (error) {
                throw error
            }

            // Ordenar historial por fecha descendente para cada incidencia
            const incidenciasConHistorial = (data as any[]).map(inc => ({
                ...inc,
                historial_cambios: inc.historial_cambios
                    ? inc.historial_cambios.sort((a: any, b: any) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )
                    : []
            }))

            setIncidencias(incidenciasConHistorial as Incidencia[])
        } catch (err) {
            console.error('Error cargando incidencias:', err)
            setError('Error al cargar las incidencias')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchIncidencias()
    }, [])

    const handleEstadoChange = async (id: number, newEstado: string) => {
        try {
            const previousEstado = incidencias.find(i => i.id === id)?.estado

            // Actualización optimista
            setIncidencias(prev => prev.map(inc =>
                inc.id === id ? {
                    ...inc,
                    estado: newEstado,
                    // Añadir optimísticamente al historial (opcional, pero mejora UX)
                    historial_cambios: [
                        {
                            id: -1, // ID temporal
                            incidencia_id: id,
                            nuevo_estado: newEstado,
                            created_at: new Date().toISOString()
                        },
                        ...(inc.historial_cambios || [])
                    ]
                } : inc
            ))

            // 1. Actualizar estado
            const { error: updateError } = await supabase
                .from('incidencias')
                .update({ estado: newEstado })
                .eq('id', id)

            if (updateError) throw updateError

            // 2. Registrar en historial si el estado cambió
            if (previousEstado !== newEstado) {
                await supabase
                    .from('historial_cambios')
                    .insert([
                        {
                            incidencia_id: id,
                            nuevo_estado: newEstado
                        }
                    ])
            }

            // Recargar para tener IDs reales y consistencia
            fetchIncidencias()

        } catch (err) {
            console.error('Error actualizando estado:', err)
            alert('Error al actualizar el estado')
            fetchIncidencias() // Recargar para asegurar consistencia
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta incidencia?')) return

        try {
            // Actualización optimista
            setIncidencias(prev => prev.filter(inc => inc.id !== id))

            const { error } = await supabase
                .from('incidencias')
                .delete()
                .eq('id', id)

            if (error) {
                throw error
            }
        } catch (err) {
            console.error('Error eliminando incidencia:', err)
            alert('Error al eliminar la incidencia')
            fetchIncidencias() // Recargar para asegurar consistencia
        }
    }

    const filteredIncidencias = incidencias.filter(inc => {
        const matchesSeccion = filterSeccion === 'TODAS' || inc.seccion === filterSeccion
        const matchesEstado = filterEstado === 'TODOS' || inc.estado === filterEstado
        const searchText = filterTexto.toLowerCase()
        const matchesTexto =
            inc.titulo.toLowerCase().includes(searchText) ||
            (inc.descripcion && inc.descripcion.toLowerCase().includes(searchText))

        return matchesSeccion && matchesEstado && matchesTexto
    })

    if (loading) return <div><p>Cargando incidencias...</p></div>
    if (error) return <div><p style={{ color: 'red' }}>{error}</p></div>

    return (
        <div style={{ marginTop: '20px' }}>
            {/* Botones de acción */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <a href="/incidencias/nueva" style={{
                    padding: '10px 20px',
                    backgroundColor: 'var(--ccoo-red)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.2)'
                }}>
                    + Nueva Incidencia
                </a>
                <a href="/orden-del-dia/informe" style={{
                    padding: '10px 20px',
                    backgroundColor: 'white',
                    color: '#64748b',
                    border: '1px solid #cbd5e1',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: 600
                }}>
                    📄 Generar Informe
                </a>
            </div>

            {/* Filtros */}
            {/* Filtros */}
            <div className="filters-container">
                {/* Filtro Sección */}
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>SECCIÓN</label>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={filterSeccion}
                            onChange={(e) => setFilterSeccion(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '0.95rem',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                backgroundColor: '#fff',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="TODAS">Todas las secciones</option>
                            {SECCIONES.map(sec => (
                                <option key={sec} value={sec}>{sec}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Filtro Estado */}
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>ESTADO</label>
                    <select
                        value={filterEstado}
                        onChange={(e) => setFilterEstado(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            outline: 'none',
                            transition: 'border-color 0.2s',
                            backgroundColor: '#fff',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="TODOS">Todos los estados</option>
                        {ESTADOS_INCIDENCIAS.map(est => (
                            <option key={est} value={est}>{est}</option>
                        ))}
                    </select>
                </div>

                {/* Búsqueda */}
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>BUSCAR</label>
                    <input
                        type="text"
                        placeholder="Buscar por título..."
                        value={filterTexto}
                        onChange={(e) => setFilterTexto(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        }}
                    />
                </div>
            </div>

            {/* Listado */}
            {filteredIncidencias.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>No se encontraron incidencias</div>
                    <div>Intenta ajustar los filtros de búsqueda</div>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {filteredIncidencias.map((incidencia) => (
                        <div
                            key={incidencia.id}
                            className="card-item"
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                                <div style={{
                                    fontSize: '0.8rem',
                                    color: '#64748b',
                                    fontWeight: 500,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    {new Date(incidencia.created_at).toLocaleDateString('es-ES', {
                                        day: 'numeric', month: 'long', year: 'numeric'
                                    })}
                                </div>

                                {/* Selector de Estado en la tarjeta */}
                                <select
                                    value={incidencia.estado}
                                    onChange={(e) => handleEstadoChange(incidencia.id, e.target.value)}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: '20px',
                                        border: 'none',
                                        fontWeight: '700',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        backgroundColor:
                                            incidencia.estado === 'Nuevo' ? '#fee2e2' :
                                                incidencia.estado === 'Comunicado Encargado' ? '#dbeafe' :
                                                    incidencia.estado === 'Orden del Dia' ? '#f3e8ff' :
                                                        incidencia.estado === 'Pendiente' ? '#ffedd5' :
                                                            '#dcfce7', // Solucionado
                                        color:
                                            incidencia.estado === 'Nuevo' ? '#991b1b' :
                                                incidencia.estado === 'Comunicado Encargado' ? '#1e40af' :
                                                    incidencia.estado === 'Orden del Dia' ? '#6b21a8' :
                                                        incidencia.estado === 'Pendiente' ? '#9a3412' :
                                                            '#166534', // Solucionado
                                        outline: 'none',
                                        appearance: 'none',
                                        textAlign: 'center'
                                    }}
                                >
                                    {ESTADOS_INCIDENCIAS.map(est => (
                                        <option key={est} value={est}>{est}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginTop: '12px' }}>
                                <span style={{
                                    backgroundColor: '#f1f5f9',
                                    color: '#475569',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    display: 'inline-block',
                                    marginBottom: '10px'
                                }}>
                                    {incidencia.seccion}
                                </span>
                                <h3 style={{
                                    margin: '0 0 10px 0',
                                    fontSize: '1.25rem',
                                    color: '#1e293b',
                                    fontWeight: 700
                                }}>
                                    {incidencia.titulo}
                                </h3>
                                {incidencia.descripcion && (
                                    <p style={{
                                        margin: '0',
                                        fontSize: '0.95rem',
                                        color: '#475569',
                                        lineHeight: '1.6',
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {incidencia.descripcion}
                                    </p>
                                )}

                                {/* Historial de Cambios */}
                                {incidencia.historial_cambios && incidencia.historial_cambios.length > 0 && (
                                    <div style={{
                                        marginTop: '15px',
                                        padding: '10px',
                                        backgroundColor: '#f8fafc',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            color: '#64748b',
                                            marginBottom: '8px',
                                            textTransform: 'uppercase'
                                        }}>
                                            Historial
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {/* Creación */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
                                                <span>Creada</span>
                                                <span>{new Date(incidencia.created_at).toLocaleString('es-ES')}</span>
                                            </div>
                                            {/* Cambios */}
                                            {incidencia.historial_cambios.map((cambio, index) => (
                                                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                                    <span style={{ fontWeight: 500, color: '#475569' }}>
                                                        Changed to {cambio.nuevo_estado}
                                                    </span>
                                                    <span style={{ color: '#94a3b8' }}>
                                                        {new Date(cambio.created_at).toLocaleString('es-ES')}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Footer: Creada por y Botón Eliminar */}
                                <div style={{
                                    marginTop: '20px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderTop: '1px solid #f1f5f9',
                                    paddingTop: '15px'
                                }}>
                                    {incidencia.creada_por ? (
                                        <div style={{
                                            fontSize: '0.8rem',
                                            color: '#94a3b8',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            <span style={{
                                                width: '24px',
                                                height: '24px',
                                                backgroundColor: '#e2e8f0',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 'bold',
                                                fontSize: '0.7rem'
                                            }}>
                                                {incidencia.creada_por.charAt(0).toUpperCase()}
                                            </span>
                                            {incidencia.creada_por}
                                        </div>
                                    ) : (
                                        <span></span>
                                    )}

                                    <button
                                        onClick={() => handleDelete(incidencia.id)}
                                        style={{
                                            backgroundColor: 'transparent',
                                            color: '#ef4444',
                                            border: '1px solid #ef4444',
                                            borderRadius: '6px',
                                            padding: '6px 12px',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
