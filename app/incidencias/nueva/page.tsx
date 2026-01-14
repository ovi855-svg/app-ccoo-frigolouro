'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function NuevaIncidenciaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    titulo: '',
    seccion: 'otros',
    descripcion: '',
    creada_por: ''
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
            descripcion: formData.descripcion,
            creada_por: formData.creada_por || 'Anónimo',
            estado: 'abierta'
          }
        ])

      if (error) throw error

      router.push('/incidencias')
      router.refresh()
    } catch (error) {
      console.error('Error al crear incidencia:', error)
      alert('Error al crear la incidencia')
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
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '500px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Título</label>
          <input
            type="text"
            name="titulo"
            required
            value={formData.titulo}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Sección</label>
          <select
            name="seccion"
            value={formData.seccion}
            onChange={handleChange}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            <option value="matadero">Matadero</option>
            <option value="despiece">Despiece</option>
            <option value="elaborados">Elaborados</option>
            <option value="mantenimiento">Mantenimiento</option>
            <option value="otros">Otros</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Descripción</label>
          <textarea
            name="descripcion"
            required
            value={formData.descripcion}
            onChange={handleChange}
            rows={4}
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Creada por</label>
          <input
            type="text"
            name="creada_por"
            value={formData.creada_por}
            onChange={handleChange}
            placeholder="Opcional"
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '0.75rem', 
            backgroundColor: '#0070f3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Guardando...' : 'Guardar Incidencia'}
        </button>
      </form>
    </main>
  )
}
