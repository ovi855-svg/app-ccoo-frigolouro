'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Incidencia } from '@/lib/types'
import { SECCIONES, ESTADOS_INCIDENCIAS } from '@/lib/constants'
import {ManagementToolbar, ManagementFilters, RecordCard, EmptyRecords} from './ManagementUI'

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

    const handleUpdateField = async (id: number, field: 'titulo' | 'descripcion' | 'contestacion', value: string) => {
        try {
            // Actualización optimista
            setIncidencias(prev => prev.map(inc =>
                inc.id === id ? { ...inc, [field]: value } : inc
            ))

            const { error } = await supabase
                .from('incidencias')
                .update({ [field]: value })
                .eq('id', id)

            if (error) throw error

            // Si se actualiza la contestación, guardar en historial
            if (field === 'contestacion') {
                const { error: historyError } = await supabase
                    .from('historial_cambios')
                    .insert([
                        {
                            incidencia_id: id,
                            nuevo_estado: 'Contestación de la Empresa'
                        }
                    ])

                if (historyError) console.error('Error guardando historial de contestación:', historyError)

                // Recargar para obtener la fecha correcta del historial
                fetchIncidencias()
            }
        } catch (err) {
            console.error(`Error actualizando ${field}:`, err)
            alert(`Error al actualizar ${field}`)
            fetchIncidencias() // Revertir cambios
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


    const resetFilters = () => { setFilterSeccion('TODAS'); setFilterEstado('TODOS'); setFilterTexto('') }
    if (loading) return <p className="loading-state" role="status">Cargando registros…</p>
    if (error) return <p className="auth-error" role="alert">{error}</p>
    return <div className="management-view">
      <ManagementToolbar createHref="/incidencias/nueva" createLabel="Nueva incidencia" reportHref="/orden-del-dia/informe"/>
      <ManagementFilters section={filterSeccion} state={filterEstado} search={filterTexto} states={ESTADOS_INCIDENCIAS} onSection={setFilterSeccion} onState={setFilterEstado} onSearch={setFilterTexto} reset={resetFilters}/>
      <p className="results-count" role="status">{filteredIncidencias.length} {filteredIncidencias.length===1?'registro encontrado':'registros encontrados'}</p>
      {filteredIncidencias.length===0 ? <EmptyRecords reset={resetFilters}/> : <div className="records-list">{filteredIncidencias.map(item=><RecordCard key={item.id} title={item.titulo} section={item.seccion} description={item.descripcion || ''} reply={item.contestacion || ''} created={item.created_at} author={item.creada_por} state={item.estado} states={ESTADOS_INCIDENCIAS}
        history={(item.historial_cambios || []).map(h=>({id:h.id, label:['Contestación Actualizada','Contestación de la Empresa'].includes(h.nuevo_estado)?'Contestación de la empresa actualizada':`Estado: ${h.nuevo_estado}`, date:h.created_at}))}
        onState={v=>void handleEstadoChange(item.id,v)} onEdit={(field,v)=>handleUpdateField(item.id,field,v)} onDelete={()=>void handleDelete(item.id)}
      />)}</div>}
    </div>
}
