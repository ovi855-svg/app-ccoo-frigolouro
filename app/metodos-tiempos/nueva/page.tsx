'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { SECCIONES, ESTADOS_SOLICITUDES } from '@/lib/constants'

export default function NuevaMetodosPage() {
    const router = useRouter()
    const supabase = createClient()
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        titulo: '',
        seccion: SECCIONES[0],
        descripcion: '',
        creada_por: '',
        estado: 'Nueva'
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

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

            router.push('/metodos-tiempos')
            router.refresh()
        } catch (error: any) {
            console.error('Error:', error)
            alert(`Error al crear la solicitud: ${error.message || 'Error desconocido'}.`)
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
        <main>
            <div className="form-container">
                <h1 style={{
                    marginTop: 0,
                    marginBottom: '25px',
                    fontSize: '1.8rem',
                    color: '#1e293b',
                    fontWeight: 700
                }}>
                    Nueva Solicitud
                </h1>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Título */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569' }}>Título / Identificador *</label>
                        <input
                            type="text"
                            name="titulo"
                            required
                            placeholder="Ej: Análisis línea 1"
                            value={formData.titulo}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'all 0.2s',
                            }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {/* Sección */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569' }}>Sección *</label>
                            <select
                                name="seccion"
                                value={formData.seccion}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '1rem',
                                    backgroundColor: 'white'
                                }}
                            >
                                {SECCIONES.map(sec => (
                                    <option key={sec} value={sec}>{sec}</option>
                                ))}
                            </select>
                        </div>

                        {/* Estado */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569' }}>Estado Inicial</label>
                            <select
                                name="estado"
                                value={formData.estado}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '1rem',
                                    backgroundColor: 'white'
                                }}
                            >
                                {ESTADOS_SOLICITUDES.map(est => (
                                    <option key={est} value={est}>{est}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569' }}>Descripción detallada</label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                            rows={5}
                            placeholder="Detalles sobre el estudio o método..."
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '1rem',
                                fontFamily: 'inherit',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    {/* Creada por */}
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#475569' }}>Creada por (Opcional)</label>
                        <input
                            type="text"
                            name="creada_por"
                            value={formData.creada_por}
                            onChange={handleChange}
                            placeholder="Tu nombre"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    {/* Botones */}
                    <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                        <button
                            type="button"
                            onClick={() => router.push('/metodos-tiempos')}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: 'white',
                                color: '#64748b',
                                border: '1px solid #cbd5e1',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                fontSize: '1rem'
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                flex: 1,
                                padding: '12px 24px',
                                backgroundColor: 'var(--ccoo-red)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontWeight: 600,
                                fontSize: '1rem',
                                boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.2)'
                            }}
                        >
                            {loading ? 'Guardando...' : 'Guardar Solicitud'}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    )
}
