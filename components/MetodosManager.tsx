'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Incidencia } from '@/lib/types'
import { SECCIONES, ESTADOS_SOLICITUDES } from '@/lib/constants'

// Usamos la misma interfaz Incidencia por ahora ya que la estructura es idéntica
// Solo cambiaremos las tablas de origen

export default function MetodosManager() {
    const [items, setItems] = useState<Incidencia[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Filtros
    const [filterSeccion, setFilterSeccion] = useState('TODAS')
    const [filterEstado, setFilterEstado] = useState('TODOS')
    const [filterTexto, setFilterTexto] = useState('')

    const supabase = createClient()

    const fetchItems = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('metodos_items')
                .select('*, metodos_historial(*)')
                .order('created_at', { ascending: false })

            if (error) {
                throw error
            }

            // Ordenar historial por fecha descendente
            const itemsConHistorial = (data as any[]).map(item => ({
                ...item,
                historial_cambios: item.metodos_historial
                    ? item.metodos_historial.sort((a: any, b: any) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )
                    : []
            }))

            setItems(itemsConHistorial as Incidencia[])
        } catch (err) {
            console.error('Error cargando items:', err)
            setError('Error al cargar datos de métodos y tiempos')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchItems()
    }, [])

    const handleEstadoChange = async (id: number, newEstado: string) => {
        try {
            const previousEstado = items.find(i => i.id === id)?.estado

            // Actualización optimista
            setItems(prev => prev.map(item =>
                item.id === id ? {
                    ...item,
                    estado: newEstado,
                    historial_cambios: [
                        {
                            id: -1,
                            incidencia_id: id, // Usamos incidencia_id para compatibilidad con tipos, aunque sea item_id
                            nuevo_estado: newEstado,
                            created_at: new Date().toISOString()
                        },
                        ...(item.historial_cambios || [])
                    ]
                } : item
            ))

            // 1. Actualizar estado
            const { error: updateError } = await supabase
                .from('metodos_items')
                .update({ estado: newEstado })
                .eq('id', id)

            if (updateError) throw updateError

            // 2. Registrar en historial si el estado cambió
            if (previousEstado !== newEstado) {
                await supabase
                    .from('metodos_historial')
                    .insert([
                        {
                            item_id: id,
                            nuevo_estado: newEstado
                        }
                    ])
            }

            fetchItems()

        } catch (err) {
            console.error('Error actualizando estado:', err)
            alert('Error al actualizar el estado')
            fetchItems()
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta solicitud?')) return

        try {
            setItems(prev => prev.filter(item => item.id !== id))

            const { error } = await supabase
                .from('metodos_items')
                .delete()
                .eq('id', id)

            if (error) {
                throw error
            }
        } catch (err) {
            console.error('Error eliminando item:', err)
            alert('Error al eliminar')
            fetchItems()
        }
    }

    const filteredItems = items.filter(item => {
        const matchesSeccion = filterSeccion === 'TODAS' || item.seccion === filterSeccion
        const matchesEstado = filterEstado === 'TODOS' || item.estado === filterEstado
        const searchText = filterTexto.toLowerCase()
        const matchesTexto =
            item.titulo.toLowerCase().includes(searchText) ||
            (item.descripcion && item.descripcion.toLowerCase().includes(searchText))

        return matchesSeccion && matchesEstado && matchesTexto
    })

    if (loading) return <div><p>Cargando datos...</p></div>
    if (error) return <div><p style={{ color: 'red' }}>{error}</p></div>

    return (
        <div style={{ marginTop: '20px' }}>
            {/* Botones de acción */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <a href="/metodos-tiempos/nueva" style={{
                    padding: '10px 20px',
                    backgroundColor: 'var(--ccoo-red)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.2)'
                }}>
                    + Nueva Solicitud
                </a>
            </div>

            {/* Filtros */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '15px',
                marginBottom: '30px',
                padding: '25px',
                backgroundColor: 'white',
                borderRadius: '16px',
                boxShadow: '0 4px 20px -8px rgba(0,0,0,0.1)'
            }}>
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
                        {ESTADOS_SOLICITUDES.map(est => (
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
            {filteredItems.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>No se encontraron solicitudes</div>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {filteredItems.map((item) => (
                        <div
                            key={item.id}
                            style={{
                                border: '1px solid #f1f5f9',
                                padding: '24px',
                                borderRadius: '16px',
                                backgroundColor: 'white',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                                <div style={{
                                    fontSize: '0.8rem',
                                    color: '#64748b',
                                    fontWeight: 500,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    {new Date(item.created_at).toLocaleDateString('es-ES', {
                                        day: 'numeric', month: 'long', year: 'numeric'
                                    })}
                                </div>

                                <select
                                    value={item.estado}
                                    onChange={(e) => handleEstadoChange(item.id, e.target.value)}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: '20px',
                                        border: 'none',
                                        fontWeight: '700',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        backgroundColor:
                                            item.estado === 'Nueva' ? '#f3f4f6' :
                                                item.estado === 'Solicitada' ? '#dbeafe' :
                                                    item.estado === 'Pendiente de respuesta' ? '#ffedd5' :
                                                        item.estado === 'Rechazada' ? '#fee2e2' :
                                                            '#dcfce7',
                                        color:
                                            item.estado === 'Nueva' ? '#4b5563' :
                                                item.estado === 'Solicitada' ? '#1e40af' :
                                                    item.estado === 'Pendiente de respuesta' ? '#9a3412' :
                                                        item.estado === 'Rechazada' ? '#991b1b' :
                                                            '#166534',
                                        outline: 'none',
                                        appearance: 'none',
                                        textAlign: 'center'
                                    }}
                                >
                                    {ESTADOS_SOLICITUDES.map(est => (
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
                                    {item.seccion}
                                </span>
                                <h3 style={{
                                    margin: '0 0 10px 0',
                                    fontSize: '1.25rem',
                                    color: '#1e293b',
                                    fontWeight: 700
                                }}>
                                    {item.titulo}
                                </h3>
                                {item.descripcion && (
                                    <p style={{
                                        margin: '0',
                                        fontSize: '0.95rem',
                                        color: '#475569',
                                        lineHeight: '1.6',
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {item.descripcion}
                                    </p>
                                )}

                                {item.historial_cambios && item.historial_cambios.length > 0 && (
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
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
                                                <span>Creada</span>
                                                <span>{new Date(item.created_at).toLocaleString('es-ES')}</span>
                                            </div>
                                            {item.historial_cambios.map((cambio, index) => (
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

                                <div style={{
                                    marginTop: '20px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderTop: '1px solid #f1f5f9',
                                    paddingTop: '15px'
                                }}>
                                    {item.creada_por ? (
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
                                                {item.creada_por.charAt(0).toUpperCase()}
                                            </span>
                                            {item.creada_por}
                                        </div>
                                    ) : (
                                        <span></span>
                                    )}

                                    <button
                                        onClick={() => handleDelete(item.id)}
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
