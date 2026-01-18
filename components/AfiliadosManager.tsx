'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Afiliado } from '@/lib/types'
import { SECCIONES } from '@/lib/constants'
import EditableText from './EditableText'

export default function AfiliadosManager() {
    const [afiliados, setAfiliados] = useState<Afiliado[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filterSeccion, setFilterSeccion] = useState('TODAS')
    const [searchTerm, setSearchTerm] = useState('')
    const [showNewForm, setShowNewForm] = useState(false)
    const [newAfiliado, setNewAfiliado] = useState<Partial<Afiliado>>({
        seccion: 'General',
        nombre_completo: ''
    })

    const supabase = createClient()

    const fetchAfiliados = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('afiliados')
                .select('*, gestiones_afiliados(*)')
                .order('nombre_completo', { ascending: true })

            if (error) throw error
            setAfiliados(data as Afiliado[])
        } catch (err) {
            console.error('Error cargando afiliados:', err)
            setError('Error al cargar afiliados')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAfiliados()
    }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (!newAfiliado.nombre_completo || !newAfiliado.seccion) {
                alert('Nombre y Sección son obligatorios')
                return
            }

            const { error } = await supabase
                .from('afiliados')
                .insert([newAfiliado])

            if (error) throw error

            setShowNewForm(false)
            setNewAfiliado({ seccion: 'General', nombre_completo: '' })
            fetchAfiliados()
        } catch (err) {
            console.error('Error creando afiliado:', err)
            alert('Error al crear afiliado')
        }
    }

    const handleUpdateField = async (id: string, field: keyof Afiliado, value: any) => {
        try {
            const { error } = await supabase
                .from('afiliados')
                .update({ [field]: value })
                .eq('id', id)

            if (error) throw error

            // Actualización optimista
            setAfiliados(prev => prev.map(a =>
                a.id === id ? { ...a, [field]: value } : a
            ))
        } catch (err) {
            console.error(`Error actualizando ${field}:`, err)
            alert(`Error al actualizar ${field}`)
            fetchAfiliados()
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este afiliado?')) return

        try {
            const { error } = await supabase
                .from('afiliados')
                .delete()
                .eq('id', id)

            if (error) throw error
            setAfiliados(prev => prev.filter(a => a.id !== id))
        } catch (err) {
            console.error('Error eliminando afiliado:', err)
            alert('Error al eliminar afiliado')
        }
    }

    const handleAddGestion = async (afiliadoId: string, gestion: string) => {
        if (!gestion.trim()) return

        try {
            const { error } = await supabase
                .from('gestiones_afiliados')
                .insert([{ afiliado_id: afiliadoId, gestion: gestion.trim() }])

            if (error) throw error

            // Recargar para obtener la nueva gestión con su fecha
            fetchAfiliados()
        } catch (err) {
            console.error('Error añadiendo gestión:', err)
            alert('Error al añadir gestión')
        }
    }

    const handleUpdateGestion = async (gestionId: string, newValue: string) => {
        try {
            const { error } = await supabase
                .from('gestiones_afiliados')
                .update({ gestion: newValue })
                .eq('id', gestionId)

            if (error) throw error

            // Actualización optimista
            setAfiliados(prev => prev.map(a => ({
                ...a,
                gestiones_afiliados: a.gestiones_afiliados?.map(g =>
                    g.id === gestionId ? { ...g, gestion: newValue } : g
                )
            })))
        } catch (err) {
            console.error('Error actualizando gestión:', err)
            alert('Error al actualizar gestión')
            fetchAfiliados()
        }
    }

    const handleDeleteGestion = async (gestionId: string) => {
        if (!confirm('¿Seguro que quieres borrar esta gestión?')) return

        try {
            const { error } = await supabase
                .from('gestiones_afiliados')
                .delete()
                .eq('id', gestionId)

            if (error) throw error

            // Actualización optimista
            setAfiliados(prev => prev.map(a => ({
                ...a,
                gestiones_afiliados: a.gestiones_afiliados?.filter(g => g.id !== gestionId)
            })))
        } catch (err) {
            console.error('Error borrando gestión:', err)
            alert('Error al borrar gestión')
            fetchAfiliados()
        }
    }

    const filteredAfiliados = afiliados.filter(a => {
        const matchesSeccion = filterSeccion === 'TODAS' || a.seccion === filterSeccion
        const searchLower = searchTerm.toLowerCase()
        const matchesSearch =
            a.nombre_completo.toLowerCase().includes(searchLower) ||
            (a.dni && a.dni.toLowerCase().includes(searchLower)) ||
            (a.localidad && a.localidad.toLowerCase().includes(searchLower))

        return matchesSeccion && matchesSearch
    })

    if (loading && afiliados.length === 0) return <div>Cargando afiliados...</div>
    if (error) return <div style={{ color: 'red' }}>{error}</div>

    return (
        <div>
            {/* Controles y Filtros */}
            <div style={{
                display: 'flex',
                gap: '15px',
                marginBottom: '20px',
                flexWrap: 'wrap',
                alignItems: 'center',
                backgroundColor: '#f8fafc',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
            }}>
                <button
                    onClick={() => setShowNewForm(!showNewForm)}
                    style={{
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 600
                    }}
                >
                    {showNewForm ? 'Cancelar' : '+ Nuevo Afiliado'}
                </button>

                <div style={{ flex: 1, minWidth: '200px' }}>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, DNI o localidad..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1'
                        }}
                    />
                </div>

                <select
                    value={filterSeccion}
                    onChange={(e) => setFilterSeccion(e.target.value)}
                    style={{
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        minWidth: '200px'
                    }}
                >
                    <option value="TODAS">Todas las secciones</option>
                    {SECCIONES.map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                    ))}
                </select>

                <div style={{ fontWeight: 600, color: '#64748b' }}>
                    Total: {filteredAfiliados.length}
                </div>
            </div>

            {/* Formulario Nuevo Afiliado */}
            {showNewForm && (
                <div style={{
                    backgroundColor: 'white',
                    padding: '25px',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    marginBottom: '30px',
                    border: '1px solid #e2e8f0'
                }}>
                    <h3 style={{ marginTop: 0, color: '#1e293b' }}>Registrar Nuevo Afiliado</h3>
                    <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '5px' }}>Nombre Completo *</label>
                            <input
                                type="text"
                                required
                                value={newAfiliado.nombre_completo}
                                onChange={e => setNewAfiliado({ ...newAfiliado, nombre_completo: e.target.value })}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '5px' }}>Sección *</label>
                            <select
                                required
                                value={newAfiliado.seccion}
                                onChange={e => setNewAfiliado({ ...newAfiliado, seccion: e.target.value })}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            >
                                {SECCIONES.map(sec => (
                                    <option key={sec} value={sec}>{sec}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '5px' }}>DNI</label>
                            <input
                                type="text"
                                value={newAfiliado.dni || ''}
                                onChange={e => setNewAfiliado({ ...newAfiliado, dni: e.target.value })}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '5px' }}>Teléfono</label>
                            <input
                                type="text"
                                value={newAfiliado.telefono || ''}
                                onChange={e => setNewAfiliado({ ...newAfiliado, telefono: e.target.value })}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '5px' }}>Dirección</label>
                            <input
                                type="text"
                                value={newAfiliado.direccion || ''}
                                onChange={e => setNewAfiliado({ ...newAfiliado, direccion: e.target.value })}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '5px' }}>Código Postal</label>
                            <input
                                type="text"
                                value={newAfiliado.codigo_postal || ''}
                                onChange={e => setNewAfiliado({ ...newAfiliado, codigo_postal: e.target.value })}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '5px' }}>Localidad</label>
                            <input
                                type="text"
                                value={newAfiliado.localidad || ''}
                                onChange={e => setNewAfiliado({ ...newAfiliado, localidad: e.target.value })}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                        </div>

                        <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                            <button
                                type="submit"
                                style={{
                                    backgroundColor: '#16a34a',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '6px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    width: '100%'
                                }}
                            >
                                Registrar Afiliado
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Lista de Afiliados */}
            <div style={{ display: 'grid', gap: '15px' }}>
                {filteredAfiliados.map(afiliado => (
                    <div key={afiliado.id} style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '12px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                        border: '1px solid #f1f5f9',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                                    <EditableText
                                        initialValue={afiliado.seccion}
                                        onSave={(val) => handleUpdateField(afiliado.id, 'seccion', val)}
                                        options={SECCIONES}
                                        style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}
                                    />
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                                    <EditableText
                                        initialValue={afiliado.nombre_completo}
                                        onSave={(val) => handleUpdateField(afiliado.id, 'nombre_completo', val)}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(afiliado.id)}
                                style={{ color: '#ef4444', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                                title="Eliminar"
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', fontSize: '0.95rem' }}>
                            <div>
                                <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem', display: 'block' }}>DNI:</span>
                                <EditableText
                                    initialValue={afiliado.dni || ''}
                                    onSave={(val) => handleUpdateField(afiliado.id, 'dni', val)}
                                    placeholder="-"
                                />
                            </div>
                            <div>
                                <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Teléfono:</span>
                                <EditableText
                                    initialValue={afiliado.telefono || ''}
                                    onSave={(val) => handleUpdateField(afiliado.id, 'telefono', val)}
                                    placeholder="-"
                                />
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Dirección:</span>
                                <EditableText
                                    initialValue={afiliado.direccion || ''}
                                    onSave={(val) => handleUpdateField(afiliado.id, 'direccion', val)}
                                    placeholder="-"
                                />
                            </div>
                            <div>
                                <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem', display: 'block' }}>CP:</span>
                                <EditableText
                                    initialValue={afiliado.codigo_postal || ''}
                                    onSave={(val) => handleUpdateField(afiliado.id, 'codigo_postal', val)}
                                    placeholder="-"
                                />
                            </div>
                            <div>
                                <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem', display: 'block' }}>Localidad:</span>
                                <EditableText
                                    initialValue={afiliado.localidad || ''}
                                    onSave={(val) => handleUpdateField(afiliado.id, 'localidad', val)}
                                    placeholder="-"
                                />
                            </div>
                        </div>

                        {/* Sección de Gestiones */}
                        <div style={{ marginTop: '15px', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                            <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Historial de Gestiones
                            </h4>

                            {/* Lista de Gestiones */}
                            {afiliado.gestiones_afiliados && afiliado.gestiones_afiliados.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                                    {[...afiliado.gestiones_afiliados]
                                        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                        .map(gestion => (
                                            <div key={gestion.id} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                gap: '10px',
                                                fontSize: '0.9rem',
                                                backgroundColor: '#f8fafc',
                                                padding: '8px',
                                                borderRadius: '6px'
                                            }}>
                                                <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                                                    <span style={{
                                                        fontWeight: 600,
                                                        color: '#64748b',
                                                        minWidth: '85px',
                                                        fontSize: '0.8rem',
                                                        paddingTop: '3px'
                                                    }}>
                                                        {new Date(gestion.created_at).toLocaleDateString('es-ES')}
                                                    </span>
                                                    <div style={{ flex: 1, color: '#334155' }}>
                                                        <EditableText
                                                            initialValue={gestion.gestion}
                                                            onSave={(val) => handleUpdateGestion(gestion.id, val)}
                                                            isTextArea={true}
                                                            style={{ backgroundColor: 'transparent', padding: 0, border: 'none' }}
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteGestion(gestion.id)}
                                                    style={{
                                                        color: '#94a3b8',
                                                        backgroundColor: 'transparent',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '1rem',
                                                        padding: '0 4px',
                                                        lineHeight: 1
                                                    }}
                                                    title="Borrar gestión"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <p style={{ fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic', marginBottom: '15px' }}>
                                    No hay gestiones registradas.
                                </p>
                            )}

                            {/* Formulario para añadir gestión */}
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    const input = e.currentTarget.elements.namedItem('nuevaGestion') as HTMLInputElement
                                    handleAddGestion(afiliado.id, input.value)
                                    input.value = ''
                                }}
                                style={{ display: 'flex', gap: '10px' }}
                            >
                                <input
                                    name="nuevaGestion"
                                    type="text"
                                    placeholder="Añadir nueva gestión..."
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #cbd5e1',
                                        fontSize: '0.9rem'
                                    }}
                                />
                                <button
                                    type="submit"
                                    style={{
                                        backgroundColor: '#3b82f6',
                                        color: 'white',
                                        border: 'none',
                                        padding: '8px 15px',
                                        borderRadius: '4px',
                                        fontWeight: 600,
                                        fontSize: '0.9rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Añadir
                                </button>
                            </form>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
