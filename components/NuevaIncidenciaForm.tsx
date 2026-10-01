'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { SECCIONES, ESTADOS_INCIDENCIAS } from '@/lib/constants'
import VoiceInput from '@/components/VoiceInput'
import Link from 'next/link'
import AppIcon from './AppIcon'

export default function NuevaIncidenciaForm() {
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

    const handleVoiceTranscript = (text: string) => {
        setFormData(prev => ({
            ...prev,
            descripcion: prev.descripcion
                ? `${prev.descripcion} ${text}`
                : text
        }))
    }

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

            router.push('/orden-del-dia')
            router.refresh()
        } catch (error: any) {
            console.error('Error al crear incidencia:', error)
            alert(`Error al crear la incidencia: ${error.message || error.toString()}`)
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


    return <section className="form-container entry-form">
      <Link href="/orden-del-dia" className="back-link"><AppIcon name="back" size={18}/>Volver al listado</Link>
      <h1>Nueva incidencia</h1><p className="form-intro">Los campos con * son obligatorios. Podrás editar el registro después.</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="titulo">Título *<input id="titulo" type="text" name="titulo" required placeholder="Un título breve y claro" value={formData.titulo} onChange={handleChange}/></label>
        <div className="grid-two-columns"><label htmlFor="seccion">Sección *<select id="seccion" name="seccion" value={formData.seccion} onChange={handleChange}>{SECCIONES.map(s=><option key={s}>{s}</option>)}</select></label><label htmlFor="estado">Estado inicial<select id="estado" name="estado" value={formData.estado} onChange={handleChange}>{ESTADOS_INCIDENCIAS.map(s=><option key={s}>{s}</option>)}</select></label></div>
        <div><div className="field-heading"><label htmlFor="descripcion">Descripción</label><VoiceInput onTranscript={handleVoiceTranscript}/></div><textarea id="descripcion" name="descripcion"  value={formData.descripcion} onChange={handleChange} rows={6} placeholder="Describe el problema y dónde ocurre…"/></div>
        <label htmlFor="creada_por">Registrado por <span className="optional-label">(opcional)</span><input id="creada_por" type="text" name="creada_por" value={formData.creada_por} onChange={handleChange} placeholder="Tu nombre" autoComplete="name"/></label>
        <div className="form-actions"><button className="button button-primary" type="submit" disabled={loading}>{loading?'Guardando…':'Guardar registro'}</button><button className="button button-secondary" type="button" disabled={loading} onClick={()=>router.push('/orden-del-dia')}>Cancelar</button></div>
      </form>
    </section>
}
