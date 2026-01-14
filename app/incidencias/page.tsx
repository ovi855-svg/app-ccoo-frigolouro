'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Incidencia } from '@/lib/types'
import { SECCIONES, ESTADOS } from '@/lib/constants'

export default function IncidenciasPage() {
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
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }
      
      setIncidencias(data || [])
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
      // Actualización optimista
      setIncidencias(prev => prev.map(inc => 
        inc.id === id ? { ...inc, estado: newEstado } : inc
      ))

      const { error } = await supabase
        .from('incidencias')
        .update({ estado: newEstado })
        .eq('id', id)

      if (error) {
        throw error
        // Podríamos revertir el estado aquí si falla
      }
    } catch (err) {
      console.error('Error actualizando estado:', err)
      alert('Error al actualizar el estado')
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

  if (loading) return <main><h1>Listado de incidencias</h1><p>Cargando...</p></main>
  if (error) return <main><h1>Listado de incidencias</h1><p style={{ color: 'red' }}>{error}</p></main>

  return (
    <main>
      <h1>Listado de incidencias</h1>
      
      {/* Botones de acción */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <a href="/incidencias/nueva" style={{ 
          padding: '8px 16px', 
          backgroundColor: '#0070f3', 
          color: 'white', 
          textDecoration: 'none', 
          borderRadius: '4px' 
        }}>
          + Nueva Incidencia
        </a>
      </div>

      {/* Filtros */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '10px', 
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        {/* Filtro Sección */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Sección</label>
          <select 
            value={filterSeccion} 
            onChange={(e) => setFilterSeccion(e.target.value)}
            style={{ width: '100%', padding: '6px' }}
          >
            <option value="TODAS">TODAS</option>
            {SECCIONES.map(sec => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>
        </div>

        {/* Filtro Estado */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Estado</label>
          <select 
            value={filterEstado} 
            onChange={(e) => setFilterEstado(e.target.value)}
            style={{ width: '100%', padding: '6px' }}
          >
            <option value="TODOS">TODOS</option>
            {ESTADOS.map(est => (
              <option key={est} value={est}>{est}</option>
            ))}
          </select>
        </div>

        {/* Búsqueda */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Buscar</label>
          <input 
            type="text" 
            placeholder="Título o descripción..." 
            value={filterTexto}
            onChange={(e) => setFilterTexto(e.target.value)}
            style={{ width: '100%', padding: '6px' }}
          />
        </div>
      </div>
      
      {/* Listado */}
      {filteredIncidencias.length === 0 ? (
        <p style={{ color: '#666' }}>No hay incidencias que coincidan con los filtros.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filteredIncidencias.map((incidencia) => (
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ fontSize: '0.85rem', color: '#666' }}>
                  {new Date(incidencia.created_at).toLocaleDateString('es-ES')}
                </div>
                
                {/* Selector de Estado en la tarjeta */}
                <select 
                  value={incidencia.estado}
                  onChange={(e) => handleEstadoChange(incidencia.id, e.target.value)}
                  style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    fontWeight: 'bold',
                    color: incidencia.estado === 'Nuevo' ? '#d32f2f' : 
                           incidencia.estado === 'Solucionado' ? '#388e3c' : '#f57c00'
                  }}
                >
                  {ESTADOS.map(est => (
                    <option key={est} value={est}>{est}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ marginTop: '0.5rem' }}>
                <span style={{ 
                  backgroundColor: '#e3f2fd', 
                  color: '#1565c0',
                  padding: '2px 8px', 
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  display: 'inline-block',
                  marginBottom: '0.5rem'
                }}>
                  {incidencia.seccion}
                </span>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>{incidencia.titulo}</h3>
                {incidencia.descripcion && (
                  <p style={{ margin: '0', fontSize: '0.95rem', color: '#444', whiteSpace: 'pre-wrap' }}>
                    {incidencia.descripcion}
                  </p>
                )}
                {incidencia.creada_por && (
                  <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>
                    Creada por: {incidencia.creada_por}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
