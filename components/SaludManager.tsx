'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { SaludLaboral } from '@/lib/types'
import { SECCIONES, ESTADOS_SALUD } from '@/lib/constants'
import {ManagementToolbar, ManagementFilters, RecordCard, EmptyRecords} from './ManagementUI'

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

    const handleUpdateField = async (id: string, field: 'titulo' | 'descripcion' | 'contestacion', value: string) => {
        try {
            setItems(prev => prev.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            ))

            const { data, error } = await supabase
                .from('salud_laboral')
                .update({ [field]: value })
                .eq('id', id).select('created_by,created_by_name,updated_by,updated_by_name,updated_at,creada_por').single()

            if (error) throw error
            setItems(previous => previous.map(record => record.id === id ? { ...record, ...data } : record))

            if (field === 'contestacion') {
                const { error: historyError } = await supabase
                    .from('historial_salud')
                    .insert([
                        {
                            salud_id: id,
                            cambio: 'Contestación de la Empresa'
                        }
                    ])

                if (historyError) console.error('Error guardando historial de contestación:', historyError)

                fetchItems()
            }
        } catch (err) {
            console.error(`Error actualizando ${field}:`, err)
            fetchItems()
            throw err
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
        const matchesTexto = (item.titulo.toLowerCase().includes(searchText) || item.descripcion.toLowerCase().includes(searchText))

        return matchesSeccion && matchesEstado && matchesTexto
    })


    const resetFilters = () => { setFilterSeccion('TODAS'); setFilterEstado('TODOS'); setFilterTexto('') }
    if (loading) return <p className="loading-state" role="status">Cargando registros…</p>
    if (error) return <p className="auth-error" role="alert">{error}</p>
    return <div className="management-view">
      <ManagementToolbar createHref="/salud-laboral/nueva" createLabel="Nueva incidencia" reportHref="/salud-laboral/informe"/>
      <ManagementFilters section={filterSeccion} state={filterEstado} search={filterTexto} states={ESTADOS_SALUD} onSection={setFilterSeccion} onState={setFilterEstado} onSearch={setFilterTexto} reset={resetFilters}/>
      <p className="results-count" role="status">{filteredItems.length} {filteredItems.length===1?'registro encontrado':'registros encontrados'}</p>
      {filteredItems.length===0 ? <EmptyRecords reset={resetFilters}/> : <div className="records-list">{filteredItems.map(item=><RecordCard key={item.id} title={item.titulo} section={item.seccion} description={item.descripcion || ''} reply={item.contestacion || ''} created={item.created_at} authorship={item} resource="salud_laboral" recordId={String(item.id)} state={item.estado} states={ESTADOS_SALUD}
        history={(item.historial_salud || []).map(h=>({id:h.id, label:['Contestación Actualizada','Contestación de la Empresa'].includes(h.cambio)?'Contestación de la empresa actualizada':`Estado: ${h.cambio}`, date:h.created_at}))}
        onState={v=>void handleEstadoChange(item.id,v)} onEdit={(field,v)=>handleUpdateField(item.id,field,v)} onDelete={()=>void handleDelete(item.id)}
      />)}</div>}
    </div>
}
