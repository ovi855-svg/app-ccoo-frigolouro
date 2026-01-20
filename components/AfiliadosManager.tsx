'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Afiliado } from '@/lib/types'
import { SECCIONES } from '@/lib/constants'
import EditableText from './EditableText'
import Papa from 'papaparse'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [importing, setImporting] = useState(false)

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
            if (!newAfiliado.nombre_completo) {
                alert('El Nombre Completo es obligatorio')
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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setImporting(true)

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                try {
                    console.log('CSV Parsed:', results.data)

                    const filas = results.data as any[]
                    // Normalización de claves para búsqueda insensible a mayúsculas/acentos
                    const normalizeKey = (key: string) => key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()

                    const nuevosAfiliados: Partial<Afiliado>[] = filas.map(fila => {
                        // Crear un mapa de claves normalizadas a valores
                        const rowMap: Record<string, any> = {}
                        Object.keys(fila).forEach(key => {
                            rowMap[normalizeKey(key)] = fila[key]
                        })

                        // Búsqueda más robusta de columnas
                        const nombre = rowMap['nombre'] ||
                            rowMap['nombre completo'] ||
                            rowMap['apellidos y nombre'] ||
                            rowMap['trabajador'] ||
                            rowMap['afiliado'] ||
                            Object.values(fila)[0] // Último recurso: primera columna

                        const seccion = rowMap['seccion'] || rowMap['departamento'] || 'General'
                        const dni = rowMap['dni'] || rowMap['nif'] || rowMap['documento']
                        const telefono = rowMap['telefono'] || rowMap['movil'] || rowMap['celular']
                        const direccion = rowMap['direccion'] || rowMap['domicilio']
                        const cp = rowMap['cp'] || rowMap['codigo postal'] || rowMap['cod postal']
                        const localidad = rowMap['localidad'] || rowMap['poblacion'] || rowMap['municipio']

                        // Validación básica: Si el nombre es muy corto (<3 chars), lo ignoramos
                        if (!nombre || typeof nombre !== 'string' || nombre.length < 3) return null

                        return {
                            nombre_completo: nombre.trim(),
                            seccion: seccion.trim(),
                            dni: dni ? String(dni).trim() : null,
                            telefono: telefono ? String(telefono).trim() : null,
                            direccion: direccion ? String(direccion).trim() : null,
                            codigo_postal: cp ? String(cp).trim() : null,
                            localidad: localidad ? String(localidad).trim() : null
                        }
                    }).filter(Boolean) as Partial<Afiliado>[]

                    if (nuevosAfiliados.length === 0) {
                        const columnasDetectadas = results.meta.fields?.join(', ') || 'Ninguna'
                        alert(`No se encontraron datos válidos. \nColumnas detectadas: ${columnasDetectadas}.\nPor favor, asegura que el archivo tenga una columna con el nombre del afiliado (ej: 'Nombre', 'Apellidos y Nombre').`)
                        return
                    }

                    const { error } = await supabase
                        .from('afiliados')
                        .insert(nuevosAfiliados)

                    if (error) throw error

                    alert(`Importados ${nuevosAfiliados.length} afiliados correctamente.`)
                    fetchAfiliados()
                    // Limpiar input
                    if (fileInputRef.current) fileInputRef.current.value = ''

                } catch (err) {
                    console.error('Error importando CSV:', err)
                    alert('Error al importar los datos.')
                } finally {
                    setImporting(false)
                }
            },
            error: (error) => {
                console.error('Error parsing CSV:', error)
                alert('Error al leer el archivo CSV')
                setImporting(false)
            }
        })
    }

    const generateAfiliadoPDF = (afiliado: Afiliado) => {
        try {
            const doc = new jsPDF()

            // Header
            doc.setFontSize(18)
            doc.setTextColor(220, 38, 38)
            doc.text('Ficha de Afiliado', 14, 20)
            doc.setFontSize(12)
            doc.setTextColor(0)
            doc.text('Sección Sindical CCOO Frigolouro', 14, 28)

            doc.setLineWidth(0.5)
            doc.setDrawColor(200, 200, 200)
            doc.line(14, 32, 196, 32)

            let yPos = 45

            // Datos Personales
            doc.setFontSize(14)
            doc.setFont('helvetica', 'bold')
            doc.text('Datos Personales', 14, yPos)
            yPos += 10

            doc.setFontSize(10)

            const data = [
                ['Nombre Completo:', afiliado.nombre_completo || '-'],
                ['Sección:', afiliado.seccion || '-'],
                ['DNI:', afiliado.dni || '-'],
                ['Teléfono:', afiliado.telefono || '-'],
                ['Dirección:', afiliado.direccion || '-'],
                ['Código Postal:', afiliado.codigo_postal || '-'],
                ['Localidad:', afiliado.localidad || '-'],
                ['Fecha Registro:', new Date(afiliado.created_at).toLocaleDateString('es-ES')]
            ]

            data.forEach(([label, value]) => {
                doc.setFont('helvetica', 'bold')
                doc.text(label, 14, yPos)
                doc.setFont('helvetica', 'normal')
                doc.text(String(value), 60, yPos)
                yPos += 7
            })

            yPos += 10

            // Historial Gestiones
            if (afiliado.gestiones_afiliados && afiliado.gestiones_afiliados.length > 0) {
                doc.setFontSize(14)
                doc.setFont('helvetica', 'bold')
                doc.text('Historial de Gestiones', 14, yPos)
                yPos += 5

                const gestionesBody = [...afiliado.gestiones_afiliados]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map(g => [
                        new Date(g.created_at).toLocaleDateString('es-ES'),
                        g.gestion
                    ])

                    ; (autoTable as any)(doc, {
                        startY: yPos,
                        head: [['Fecha', 'Gestión']],
                        body: gestionesBody,
                        theme: 'striped',
                        styles: { fontSize: 10, cellPadding: 3 },
                        headStyles: { fillColor: [60, 60, 60], textColor: 255 },
                        columnStyles: { 0: { cellWidth: 30 } }, // Fecha width
                    })
            } else {
                doc.setFontSize(10)
                doc.setTextColor(100)
                doc.text('No hay gestiones registradas.', 14, yPos)
            }

            doc.save(`ficha_${afiliado.nombre_completo.replace(/\s+/g, '_')}.pdf`)

        } catch (err) {
            console.error('Error generando PDF individual:', err)
            alert('Error al generar el PDF del afiliado')
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

                <div style={{ position: 'relative' }}>
                    <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importing}
                        style={{
                            backgroundColor: '#0ea5e9',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: importing ? 0.7 : 1
                        }}
                    >
                        {importing ? 'Importando...' : (
                            <>
                                <span style={{ fontSize: '1.2rem', lineHeight: 0.5 }}>⫯</span>
                                Añadir mediante CSV
                            </>
                        )}
                    </button>
                </div>

                <a href="/afiliados/informe" style={{
                    backgroundColor: 'white',
                    color: '#64748b',
                    border: '1px solid #cbd5e1',
                    padding: '10px 20px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                }}>
                    📄 Informe PDF
                </a>

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
                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '5px' }}>Sección</label>
                            <select
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
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => generateAfiliadoPDF(afiliado)}
                                    style={{
                                        color: '#3b82f6',
                                        backgroundColor: '#eff6ff',
                                        border: '1px solid #bfdbfe',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        padding: '4px 8px',
                                        fontWeight: 600
                                    }}
                                    title="Descargar Ficha PDF"
                                >
                                    📄 PDF
                                </button>
                                <button
                                    onClick={() => handleDelete(afiliado.id)}
                                    style={{ color: '#ef4444', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                                    title="Eliminar"
                                >
                                    ×
                                </button>
                            </div>

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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                    <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.8rem' }}>Teléfono:</span>
                                    {afiliado.telefono && (
                                        <a
                                            href={`tel:${afiliado.telefono}`}
                                            style={{
                                                backgroundColor: '#dcfce7',
                                                color: '#16a34a',
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                textDecoration: 'none',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                border: '1px solid #86efac'
                                            }}
                                        >
                                            📞 Llamar
                                        </a>
                                    )}
                                </div>
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
