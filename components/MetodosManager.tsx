'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Incidencia } from '@/lib/types'
import { SECCIONES, ESTADOS_SOLICITUDES } from '@/lib/constants'
import {ManagementToolbar, ManagementFilters, RecordCard, EmptyRecords} from './ManagementUI'

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

    const handleUpdateField = async (id: number, field: 'titulo' | 'descripcion' | 'contestacion', value: string) => {
        try {
            setItems(prev => prev.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            ))

            const { error } = await supabase
                .from('metodos_items')
                .update({ [field]: value })
                .eq('id', id)

            if (error) throw error

            if (field === 'contestacion') {
                const { error: historyError } = await supabase
                    .from('metodos_historial')
                    .insert([
                        {
                            item_id: id,
                            nuevo_estado: 'Contestación de la Empresa'
                        }
                    ])

                if (historyError) console.error('Error guardando historial de contestación:', historyError)

                fetchItems()
            }
        } catch (err) {
            console.error(`Error actualizando ${field}:`, err)
            alert(`Error al actualizar ${field}`)
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


    const resetFilters = () => { setFilterSeccion('TODAS'); setFilterEstado('TODOS'); setFilterTexto('') }
    if (loading) return <p className="loading-state" role="status">Cargando registros…</p>
    if (error) return <p className="auth-error" role="alert">{error}</p>
    return <div className="management-view">
      <ManagementToolbar createHref="/metodos-tiempos/nueva" createLabel="Nueva solicitud" reportHref="/metodos-tiempos/informe"/>
      <ManagementFilters section={filterSeccion} state={filterEstado} search={filterTexto} states={ESTADOS_SOLICITUDES} onSection={setFilterSeccion} onState={setFilterEstado} onSearch={setFilterTexto} reset={resetFilters}/>
      <p className="results-count" role="status">{filteredItems.length} {filteredItems.length===1?'registro encontrado':'registros encontrados'}</p>
      {filteredItems.length===0 ? <EmptyRecords reset={resetFilters}/> : <div className="records-list">{filteredItems.map(item=><RecordCard key={item.id} title={item.titulo} section={item.seccion} description={item.descripcion || ''} reply={item.contestacion || ''} created={item.created_at} author={item.creada_por} state={item.estado} states={ESTADOS_SOLICITUDES}
        history={(item.historial_cambios || []).map(h=>({id:h.id, label:['Contestación Actualizada','Contestación de la Empresa'].includes(h.nuevo_estado)?'Contestación de la empresa actualizada':`Estado: ${h.nuevo_estado}`, date:h.created_at}))}
        onState={v=>void handleEstadoChange(item.id,v)} onEdit={(field,v)=>handleUpdateField(item.id,field,v)} onDelete={()=>void handleDelete(item.id)}
      />)}</div>}
    </div>
}
