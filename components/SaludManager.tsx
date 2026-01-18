'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { SaludLaboral } from '@/lib/types'
import { SECCIONES, ESTADOS_SALUD } from '@/lib/constants'
import EditableText from './EditableText'

export default function SaludManager() {
    const [items, setItems] = useState<SaludLaboral[]>([])
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
                .from('salud_laboral')
                .select('*, historial_salud(*)')
                .order('created_at', { ascending: false })

            if (error) {
                throw error
            }

            // Ordenar historial por fecha descendente
            const itemsConHistorial = (data as any[]).map(item => ({
                ...item,
                historial_salud: item.historial_salud
                    ? item.historial_salud.sort((a: any, b: any) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )
                    : []
            }))

            setItems(itemsConHistorial as SaludLaboral[])
        } catch (err) {
            console.error('Error cargando salud laboral:', err)
            setError('Error al cargar datos de salud laboral')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchItems()
    }, [])

    const handleEstadoChange = async (id: string, newEstado: string) => {
        try {
            const previousEstado = items.find(i => i.id === id)?.estado

            // Actualización optimista
            setItems(prev => prev.map(item =>
                item.id === id ? {
                    ...item,
                    estado: newEstado,
                    historial_salud: [
                        {
                            id: 'temp-id',
                            salud_id: id,
                            cambio: newEstado,
                            created_at: new Date().toISOString()
                        },
                        ...(item.historial_salud || [])
                    ]
                } : item
            ))

            // 1. Actualizar estado
            const { error: updateError } = await supabase
                .from('salud_laboral')
                .update({ estado: newEstado })
                .eq('id', id)

            if (updateError) throw updateError

            // 2. Registrar en historial si el estado cambió
            if (previousEstado !== newEstado) {
                await supabase
                    .from('historial_salud')
                    .insert([
                        {
                            salud_id: id,
                            cambio: newEstado
                        }
                    ])
            }

            // Recargar para tener IDs reales y consistencia
            fetchItems()

        } catch (err) {
            console.error('Error actualizando estado:', err)
            alert('Error al actualizar el estado')
            fetchItems()
        }
    }

    const handleUpdateField = async (id: string, field: 'titulo' | 'descripcion', value: string) => {
        try {
            setItems(prev => prev.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            ))

            const { error } = await supabase
                .from('salud_laboral')
                .update({ [field]: value })
                .eq('id', id)

            if (error) throw error
        } catch (err) {
            console.error(`Error actualizando ${field}:`, err)
            alert(`Error al actualizar ${field}`)
            fetchItems()
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este registro?')) return

        try {
            // Actualización optimista
            setItems(prev => prev.filter(item => item.id !== id))

            const { error } = await supabase
                .from('salud_laboral')
                .delete()
                .eq('id', id)

            if (error) {
                throw error
            }
        } catch (err) {
            console.error('Error eliminando registro:', err)
            alert('Error al eliminar el registro')
            fetchItems()
        }
    }

    const filteredItems = items.filter(item => {
        const matchesSeccion = filterSeccion === 'TODAS' || item.seccion === filterSeccion
        const matchesEstado = filterEstado === 'TODOS' || item.estado === filterEstado
        const searchText = filterTexto.toLowerCase()
        const matchesTexto = item.descripcion.toLowerCase().includes(searchText)

        return matchesSeccion && matchesEstado && matchesTexto
    })

    if (loading) return <div><p>Cargando datos...</p></div>
    if (error) return <div><p style={{ color: 'red' }}>{error}</p></div>

    return (
        <div style={{ marginTop: '20px' }}>
            {/* Botones de acción */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <a href="/salud-laboral/nueva" style={{
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
                <a href="/salud-laboral/informe" style={{
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
                        {ESTADOS_SALUD.map(est => (
                            <option key={est} value={est}>{est}</option>
                        ))}
                    </select>
                </div>

                {/* Búsqueda */}
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>BUSCAR</label>
                    <input
                        type="text"
                        placeholder="Buscar en descripción..."
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
                    <div style={{ fontSize: '1.2rem', marginBottom: '10px' }}>No se encontraron registros</div>
                    <div>Intenta ajustar los filtros de búsqueda</div>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {filteredItems.map((item) => (
                        <div
                            key={item.id}
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
                                    {new Date(item.created_at).toLocaleDateString('es-ES', {
                                        day: 'numeric', month: 'long', year: 'numeric'
                                    })}
                                    {item.creada_por && (
                                        <span style={{ marginLeft: '10px', color: '#94a3b8' }}>• Por: {item.creada_por}</span>
                                    )}
                                </div>

                                {/* Selector de Estado */}
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
                                            item.estado === 'Nueva' ? '#fee2e2' : // Red
                                                item.estado === 'Comunicado al Servicio de Prevencion' ? '#dbeafe' : // Blue
                                                    item.estado === 'Pendiente' ? '#ffedd5' : // Orange
                                                        item.estado === 'Denunciado en Inspeccion de Trabajo' ? '#f3e8ff' : // Purple
                                                            '#dcfce7', // Solucionado (Green)
                                        color:
                                            item.estado === 'Nueva' ? '#991b1b' :
                                                item.estado === 'Comunicado al Servicio de Prevencion' ? '#1e40af' :
                                                    item.estado === 'Pendiente' ? '#9a3412' :
                                                        item.estado === 'Denunciado en Inspeccion de Trabajo' ? '#6b21a8' :
                                                            '#166534', // Solucionado
                                        outline: 'none',
                                        appearance: 'none',
                                        textAlign: 'center',
                                        maxWidth: '100%',
                                        whiteSpace: 'normal',
                                        height: 'auto'
                                    }}
                                >
                                    {ESTADOS_SALUD.map(est => (
                                        <option key={est} value={est}>{est}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginTop: '12px' }}>
                                <div style={{ marginBottom: '10px' }}>
                                    <EditableText
                                        initialValue={item.titulo}
                                        onSave={(val) => handleUpdateField(item.id, 'titulo', val)}
                                        className="h3-editable"
                                        style={{
                                            fontSize: '1.25rem',
                                            fontWeight: 700,
                                            color: '#1e293b',
                                            margin: 0
                                        }}
                                        placeholder="Sin título"
                                    />
                                </div>
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

                                <div style={{ marginBottom: '15px' }}>
                                    <EditableText
                                        initialValue={item.descripcion || ''}
                                        onSave={(val) => handleUpdateField(item.id, 'descripcion', val)}
                                        isTextArea={true}
                                        style={{
                                            fontSize: '0.95rem',
                                            color: '#475569',
                                            lineHeight: '1.6',
                                            whiteSpace: 'pre-wrap'
                                        }}
                                        placeholder="Añadir descripción detallada..."
                                    />
                                </div>

                                {/* Historial de Cambios */}
                                {item.historial_salud && item.historial_salud.length > 0 && (
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
                                                <span>{new Date(item.created_at).toLocaleString('es-ES')}</span>
                                            </div>
                                            {/* Cambios */}
                                            {item.historial_salud.map((cambio, index) => (
                                                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                                    <span style={{ fontWeight: 500, color: '#475569' }}>
                                                        Changed to {cambio.cambio}
                                                    </span>
                                                    <span style={{ color: '#94a3b8' }}>
                                                        {new Date(cambio.created_at).toLocaleString('es-ES')}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Footer: Botón Eliminar */}
                                <div style={{
                                    marginTop: '20px',
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    alignItems: 'center',
                                    borderTop: '1px solid #f1f5f9',
                                    paddingTop: '15px'
                                }}>
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
