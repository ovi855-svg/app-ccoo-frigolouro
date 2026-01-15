'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { SECCIONES, ESTADOS } from '@/lib/constants'
import { useRouter } from 'next/navigation'

export default function NuevaIncidenciaMetodos() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        titulo: '',
        seccion: 'MATADERO',
        descripcion: '',
        creada_por: '',
        estado: 'Nuevo'
    })

    const supabase = createClient()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        if (!formData.titulo.trim()) {
            alert('El título es obligatorio')
            setLoading(false)
            return
        }

        try {
            const { error } = await supabase
                .from('metodos_items')
                .insert([
                    {
                        titulo: formData.titulo,
                        seccion: formData.seccion,
                        descripcion: formData.descripcion || null,
                        creada_por: formData.creada_por || null,
                        estado: formData.estado
                    }
                ])

            if (error) throw error

            alert('Registro creado correctamente')
            router.push('/metodos-tiempos')
            router.refresh()
        } catch (error: any) {
            console.error('Error:', error)
            alert(`Error al crear el registro: ${error.message || 'Error desconocido'}.`)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    return (
        <main style={{
            maxWidth: '800px',
            margin: '40px auto',
            padding: '40px',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
            <h1 style={{
                marginTop: 0,
                marginBottom: '25px',
                fontSize: '1.8rem',
                color: '#1e293b',
                fontWeight: 700
            }}>
                Nuevo registro Métodos
            </h1>
            
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569' }}>
                        Título *
                    </label>
                    <input
                        type="text"
                        name="titulo"
                        value={formData.titulo}
                        onChange={handleChange}
                        required
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569' }}>
                            Sección
                        </label>
                        <select
                            name="seccion"
                            value={formData.seccion}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                backgroundColor: 'white',
                                outline: 'none'
                            }}
                        >
                            {SECCIONES.map(sec => (
                                <option key={sec} value={sec}>{sec}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569' }}>
                            Estado Inicial
                        </label>
                        <select
                            name="estado"
                            value={formData.estado}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                backgroundColor: 'white',
                                outline: 'none'
                            }}
                        >
                            {ESTADOS.map(est => (
                                <option key={est} value={est}>{est}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569' }}>
                        Descripción
                    </label>
                    <textarea
                        name="descripcion"
                        value={formData.descripcion}
                        onChange={handleChange}
                        rows={6}
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            resize: 'vertical',
                            outline: 'none'
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569' }}>
                        Creada por (Opcional)
                    </label>
                    <input
                        type="text"
                        name="creada_por"
                        value={formData.creada_por}
                        onChange={handleChange}
                        placeholder="Tu nombre"
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            outline: 'none'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        style={{
                            padding: '14px 28px',
                            backgroundColor: 'white',
                            color: '#64748b',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            flex: 1,
                            padding: '14px',
                            backgroundColor: 'var(--ccoo-red)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.2)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {loading ? 'Guardando...' : 'Guardar Registro'}
                    </button>
                </div>
            </form>
        </main>
    )
}