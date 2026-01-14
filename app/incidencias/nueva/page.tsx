'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { SECCIONES, ESTADOS } from '@/lib/constants'

export default function NuevaIncidenciaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    titulo: '',
    seccion: SECCIONES[0],
    descripcion: '',
    creada_por: '',
    estado: 'Nuevo'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('incidencias')
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

      router.push('/incidencias')
      router.refresh()
    } catch (error) {
      console.error('Error al crear incidencia:', error)
      alert('Error al crear la incidencia. Por favor, inténtelo de nuevo.')
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
      <h1>Nueva incidencia</h1>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
        
        {/* Título */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Título *</label>
          <input
            type="text"
            name="titulo"
            required
            value={formData.titulo}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        {/* Sección */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Sección *</label>
          <select
            name="seccion"
            value={formData.seccion}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            {SECCIONES.map(sec => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
        </div>

        {/* Estado (Opcional, por defecto Nuevo) */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Estado Inicial</label>
          <select
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          >
             {ESTADOS.map(est => (
              <option key={est} value={est}>{est}</option>
            ))}
          </select>
        </div>

        {/* Descripción */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Descripción</label>
          <textarea
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            rows={4}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        {/* Creada por */}
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Creada por</label>
          <input
            type="text"
            name="creada_por"
            value={formData.creada_por}
            onChange={handleChange}
            placeholder="Opcional"
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              flex: 1,
              padding: '0.75rem', 
              backgroundColor: '#0070f3', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Guardando...' : 'Guardar Incidencia'}
          </button>
          
          <button 
            type="button"
            onClick={() => router.push('/incidencias')}
            style={{ 
              padding: '0.75rem 1.5rem', 
              backgroundColor: '#f5f5f5', 
              color: '#333', 
              border: '1px solid #ccc', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </main>
  )
}
