"use client"

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { Afiliado } from '@/lib/types'
import { SECCIONES } from '@/lib/constants'
import { AFFILIATION_FIELDS, displayField, normalizeText, parseAffiliationRows, paymentLabel, type ImportRow, type ImportPreview } from '@/lib/affiliation'
import EditableText from './EditableText'

const sections = ['Sin asignar', ...SECCIONES]
const countLabel = (count: number, one: string, many: string) => `${count} ${count===1?one:many}`
function messageOf(error: unknown): string {
  const e = error as { code?: string; message?: string }
  if (e.code === '23505') return 'Ya existe una ficha con ese DNI/NIE. Busca la ficha y edítala o reactívala.'
  if (e.code === 'PGRST116') return 'La ficha ha cambiado o ya no está disponible. Recarga la página y revisa los datos antes de guardar.'
  return e.message || 'No se pudo completar la operación. Inténtalo de nuevo.'
}

export default function AfiliadosManager() {
  const [people, setPeople] = useState<Afiliado[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [status, setStatus] = useState<'activa' | 'baja'>('activa')
  const [section, setSection] = useState('TODAS')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<Afiliado>>({})
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<ImportRow[] | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [resolutions, setResolutions] = useState<Record<string,string>>({})
  const [completeList, setCompleteList] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  async function load() {
    setLoading(true)
    try {
      // Paginate the API so a future list larger than its default row limit is complete.
      const all: Afiliado[] = []
      for (let start = 0; ; start += 500) {
        const { data, error } = await supabase.from('afiliados').select('*, gestiones_afiliados(*)').order('nombre_completo').order('id').range(start,start+499)
        if (error) throw error
        all.push(...(data as Afiliado[]))
        if (data.length < 500) break
      }
      setPeople(all)
    } catch (e) { setError(messageOf(e)) }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])
  useEffect(() => { setPage(0) }, [status,section,search])

  function edit(person?: Afiliado) {
    setEditing(person?.id || 'new')
    setDraft(person ? { ...person } : { nombre: '', apellidos: '', seccion: 'Sin asignar', estado_afiliacion: 'activa' })
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  async function save(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true); setError(''); setNotice('')
    try {
      const values: Record<string, string | null> = {}
      AFFILIATION_FIELDS.forEach(([key]) => { values[key] = String(draft[key] || '').trim() || null })
      values.nombre_completo = values.nombre && values.apellidos ? `${values.apellidos}, ${values.nombre}` : draft.nombre_completo || ''
      values.seccion = draft.seccion || 'Sin asignar'
      let query = editing === 'new' ? supabase.from('afiliados').insert(values) : supabase.from('afiliados').update(values).eq('id',editing!)
      if (editing !== 'new' && draft.updated_at) query = query.eq('updated_at',draft.updated_at)
      const { error } = await query.select('id').single()
      if (error) throw error
      setEditing(null); setNotice('Ficha guardada.'); await load()
    } catch (e) { setError(messageOf(e)) }
    finally { setBusy(false) }
  }
  async function changeStatus(person: Afiliado) {
    const archive = person.estado_afiliacion === 'activa'
    if (!confirm(archive ? '¿Pasar esta ficha a Bajas de afiliación? Se conservarán todos sus datos y gestiones.' : '¿Reactivar esta misma ficha?')) return
    setBusy(true); setError('')
    try {
      const { error } = await supabase.from('afiliados').update({ estado_afiliacion: archive ? 'baja' : 'activa', motivo_baja: archive ? 'Baja registrada manualmente' : null }).eq('id',person.id).select('id').single()
      if (error) throw error
      setNotice(archive ? 'Ficha archivada en Bajas de afiliación.' : 'Ficha reactivada.'); await load()
    } catch(e) { setError(messageOf(e)) }
    finally { setBusy(false) }
  }
  async function gestion(personId: string, text: string, gestionId?: string, remove = false): Promise<boolean> {
    if (!remove && !text.trim()) return false
    if (remove && !confirm('¿Borrar esta gestión?')) return false
    setBusy(true); setError('')
    try {
      const query = remove ? supabase.from('gestiones_afiliados').delete().eq('id',gestionId!) : gestionId ? supabase.from('gestiones_afiliados').update({ gestion: text.trim() }).eq('id',gestionId) : supabase.from('gestiones_afiliados').insert({ afiliado_id: personId, gestion: text.trim() })
      const { error } = await query.select('id').single()
      if(error) throw error
      await load(); return true
    } catch(e) { setError(messageOf(e)); return false }
    finally { setBusy(false) }
  }
  async function download(person: Afiliado) {
    try {
      const { affiliationPDF } = await import('@/lib/affiliation-pdf')
      affiliationPDF(person).save(`ficha_${person.nombre_completo.replace(/[^a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ]+/g,'_')}.pdf`)
    } catch(e) { setError(messageOf(e)) }
  }
  async function review(importRows: ImportRow[], choices: Record<string,string>) {
    const { data, error } = await supabase.rpc('sincronizar_afiliacion', { p_filas: importRows, p_resoluciones: choices })
    if (error) throw error
    setPreview(data as ImportPreview)
  }
  async function upload(file?: File) {
    if (!file) return
    setBusy(true); setError(''); setNotice(''); setPreview(null); setRows(null); setResolutions({}); setCompleteList(false)
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error('El archivo supera 10 MB.')
      let table: unknown[][]
      if (/\.csv$/i.test(file.name)) {
        const Papa = (await import('papaparse')).default
        const parsed = Papa.parse<unknown[]>(await file.text(), { skipEmptyLines: 'greedy' })
        if (parsed.errors.length) throw new Error('El CSV contiene errores. Revisa el archivo completo.')
        table = parsed.data
      } else if (/\.(xlsx|xlsm)$/i.test(file.name)) {
        const { readSheet } = await import('read-excel-file/browser')
        table = await readSheet(file)
      } else throw new Error('Selecciona un archivo XLSX, XLSM o CSV con las 16 columnas del listado completo.')
      const parsedRows = parseAffiliationRows(table)
      setRows(parsedRows); setFileName(file.name)
      await review(parsedRows,{})
    } catch(e) { setError(messageOf(e)); setRows(null) }
    finally { setBusy(false); if(input.current) input.current.value='' }
  }
  async function resolve() {
    if (!rows) return
    setBusy(true); setError('')
    try { await review(rows,resolutions) } catch(e) { setError(messageOf(e)) }
    finally { setBusy(false) }
  }
  async function applyImport() {
    if (!rows || !preview || !completeList || preview.conflictos.length) return
    setBusy(true); setError('')
    try {
      const { data, error } = await supabase.rpc('sincronizar_afiliacion', { p_filas: rows, p_aplicar: true, p_resoluciones: resolutions, p_revision: preview.revision })
      if(error) throw error
      setNotice(`Actualización completada: ${data.total} personas activas, ${data.altas} altas, ${data.actualizadas} fichas actualizadas (${data.reactivadas} reactivadas) y ${data.bajas} bajas archivadas.`)
      setPreview(null); setRows(null); setStatus('activa'); setPage(0); await load()
    } catch(e) { setError(messageOf(e)) }
    finally { setBusy(false) }
  }

  const filtered = people.filter(p => p.estado_afiliacion===status && (section==='TODAS' || p.seccion===section) && normalizeText([p.nombre_completo,p.dni,p.correo_electronico,p.telefono_movil,p.telefono_fijo,p.localidad].join(' ')).includes(normalizeText(search)))
  const pages = Math.max(1,Math.ceil(filtered.length/20))
  const currentPage = Math.min(page,pages-1)
  const visible = filtered.slice(currentPage*20,(currentPage+1)*20)
  const legacy = editing !== 'new' && !draft.nombre && !draft.apellidos

  return <div className="affiliation-manager" aria-busy={busy}>
    {error && <p role="alert" className="auth-error">{error}</p>}
    {notice && <p role="status" className="auth-message">{notice}</p>}
    <div className="aff-toolbar">
      <button type="button" className="aff-primary" disabled={busy} onClick={()=>edit()}>Añadir persona</button>
      <button type="button" disabled={busy} onClick={()=>input.current?.click()}>{busy?'Procesando…':'Actualizar desde Excel'}</button>
      <input ref={input} type="file" accept=".xlsx,.xlsm,.csv" hidden onChange={e=>void upload(e.target.files?.[0])}/>
      <Link href="/afiliados/informe">Informe PDF</Link>
    </div>

    {editing && <section className="aff-panel">
      <h2>{editing==='new'?'Nueva ficha de afiliación':'Editar ficha de afiliación'}</h2>
      <form onSubmit={save}>
        <div className="aff-fields">
          {legacy && <label>Nombre completo<input value={draft.nombre_completo || ''} required onChange={e=>setDraft({...draft,nombre_completo:e.target.value})}/></label>}
          {AFFILIATION_FIELDS.map(([key,label,type])=><label key={key}>{label}<input type={type} value={draft[key] || ''} required={!legacy && (key==='nombre' || key==='apellidos')} maxLength={key==='fecha_nacimiento'?undefined:500} onChange={e=>setDraft({...draft,[key]:e.target.value})}/></label>)}
          <label>Sección<select value={draft.seccion || 'Sin asignar'} onChange={e=>setDraft({...draft,seccion:e.target.value})}>{Array.from(new Set([...sections,draft.seccion || 'Sin asignar'])).map(s=><option key={s}>{s}</option>)}</select></label>
        </div>
        <p className="aff-note">AC significa al corriente de pago. Puedes escribir otro estado de pago. La baja de afiliación se gestiona por separado.</p>
        <div className="aff-toolbar"><button className="aff-primary" disabled={busy}>Guardar ficha</button><button type="button" disabled={busy} onClick={()=>setEditing(null)}>Cancelar</button></div>
      </form>
    </section>}

    {preview && <section className="aff-panel" aria-label="Vista previa de importación">
      <h2>Vista previa del listado completo</h2>
      <p>{fileName}: <strong>{countLabel(preview.total,'persona','personas')}</strong>. {countLabel(preview.altas,'alta','altas')}, {countLabel(preview.actualizadas,'actualización','actualizaciones')} ({countLabel(preview.reactivadas,'reactivación','reactivaciones')}) y {countLabel(preview.bajas,'baja','bajas')}.</p>
      <p className="aff-note">Se conservarán las secciones conocidas y las gestiones. Las altas tendrán la sección «Sin asignar». Las celdas vacías del Excel dejarán vacíos esos campos en las fichas actualizadas.</p>
      {preview.conflictos.length>0 && <div>
        <h3>Coincidencias que debes resolver</h3>
        <p>Hay nombres coincidentes con documentos distintos. Elige cómo tratarlos antes de continuar.</p>
        {preview.conflictos.map(c=><label className="aff-conflict" key={c.documento}>
          {c.nombre}. Excel: {c.documento}. {c.documento_anterior && `Ficha actual: ${c.documento_anterior} (${c.seccion}).`}
          <select value={resolutions[c.documento] || ''} onChange={e=>setResolutions({...resolutions,[c.documento]:e.target.value})}>
            <option value="">Selecciona una opción</option>
            {c.candidato_id && <option value={c.candidato_id}>Es la misma persona: corregir DNI y conservar ficha</option>}
            <option value="nueva">Es otra persona: crear ficha nueva</option>
          </select>
        </label>)}
        <button type="button" disabled={busy || preview.conflictos.some(c=>!resolutions[c.documento])} onClick={()=>void resolve()}>Revisar coincidencias</button>
      </div>}
      <details><summary>Ver altas y reactivaciones</summary><ul>{preview.entradas.filter(e=>e.accion!=='actualizacion').map(e=><li key={e.documento}>{e.nombre} · {e.accion==='alta'?'Alta':'Reactivación'}</li>)}</ul></details>
      <details><summary>Ver personas que pasarán a bajas ({preview.bajas})</summary><ul>{preview.ausentes.map(p=><li key={p.id}>{p.nombre} · {p.seccion}</li>)}</ul></details>
      <p className="aff-note">La ausencia se registra en la fecha de importación. No equivale a conocer la fecha efectiva de baja.</p>
      <label className="aff-check"><input type="checkbox" checked={completeList} onChange={e=>setCompleteList(e.target.checked)}/>Confirmo que este archivo es el listado completo y actualizado de afiliación, y he revisado las bajas.</label>
      <div className="aff-toolbar"><button className="aff-primary" disabled={busy || !completeList || preview.conflictos.length>0} onClick={()=>void applyImport()}>Aplicar actualización</button><button disabled={busy} onClick={()=>{setPreview(null);setRows(null)}}>Cancelar importación</button></div>
    </section>}

    <div className="aff-toolbar" role="group" aria-label="Estado de afiliación">
      <button aria-pressed={status==='activa'} onClick={()=>setStatus('activa')}>Afiliación activa ({people.filter(p=>p.estado_afiliacion==='activa').length})</button>
      <button aria-pressed={status==='baja'} onClick={()=>setStatus('baja')}>Bajas de afiliación ({people.filter(p=>p.estado_afiliacion==='baja').length})</button>
    </div>
    <div className="aff-filters">
      <label>Buscar<input type="search" value={search} placeholder="Nombre, DNI/NIE, teléfono, correo o localidad" onChange={e=>setSearch(e.target.value)}/></label>
      <label>Sección<select value={section} onChange={e=>setSection(e.target.value)}><option value="TODAS">Todas las secciones</option>{Array.from(new Set([...sections,...people.map(p=>p.seccion)])).map(s=><option key={s}>{s}</option>)}</select></label>
    </div>
    <p className="aff-note">{loading?'Cargando fichas…':`${countLabel(filtered.length,'ficha encontrada','fichas encontradas')}. Abre una ficha para consultar todos sus datos y gestiones.`}</p>
    {visible.map(person=><details className="aff-panel aff-person" key={person.id}>
      <summary><strong>{person.nombre_completo}</strong><span>{person.seccion} · {paymentLabel(person.estado_pago)}{person.estado_afiliacion==='baja'?' · Baja':''}</span></summary>
      <div className="aff-toolbar"><button disabled={busy} onClick={()=>edit(person)}>Editar ficha</button><button onClick={()=>void download(person)}>Ficha PDF</button><button disabled={busy} onClick={()=>void changeStatus(person)}>{person.estado_afiliacion==='baja'?'Reactivar afiliación':'Pasar a bajas'}</button></div>
      <dl className="aff-fields">{AFFILIATION_FIELDS.map(([key,label])=><div key={key}><dt>{label}</dt><dd>{displayField(person,key)}</dd></div>)}</dl>
      {!person.telefono_movil && !person.telefono_fijo && person.telefono && <p>Teléfono de la ficha anterior: <a href={`tel:${person.telefono}`}>{person.telefono}</a></p>}
      {(person.telefono_movil || person.telefono_fijo || person.correo_electronico) && <div className="aff-toolbar">
        {person.telefono_movil && <a href={`tel:${person.telefono_movil}`}>Llamar al móvil</a>}
        {person.telefono_fijo && <a href={`tel:${person.telefono_fijo}`}>Llamar al fijo</a>}
        {person.correo_electronico && <a href={`mailto:${person.correo_electronico}`}>Escribir correo</a>}
      </div>}
      {person.estado_afiliacion==='baja' && <p className="aff-note">{person.motivo_baja || 'Baja registrada'}.{person.ausencia_detectada_en && ` Última ausencia detectada: ${new Date(person.ausencia_detectada_en).toLocaleDateString('es-ES')}. No indica la fecha efectiva de baja.`}</p>}
      <h3>Historial de gestiones</h3>
      {person.gestiones_afiliados?.length ? [...person.gestiones_afiliados].sort((a,b)=>b.created_at.localeCompare(a.created_at)).map(g=><div className="aff-gestion" key={g.id}>
        <time dateTime={g.created_at}>{new Date(g.created_at).toLocaleDateString('es-ES')}</time>
        <EditableText initialValue={g.gestion} isTextArea onSave={async text=>{if(!await gestion(person.id,text,g.id)) throw new Error('No se pudo guardar la gestión')}}/>
        <button disabled={busy} aria-label="Borrar gestión" onClick={()=>void gestion(person.id,'',g.id,true)}>×</button>
      </div>) : <p className="aff-note">No hay gestiones registradas.</p>}
      <form className="aff-toolbar" onSubmit={async e=>{
        e.preventDefault(); const form=e.currentTarget; const value=form.elements.namedItem('gestion') as HTMLInputElement;
        if(await gestion(person.id,value.value)) form.reset()
      }}><input name="gestion" aria-label="Nueva gestión" required placeholder="Añadir nueva gestión…"/><button disabled={busy}>Añadir gestión</button></form>
    </details>)}
    {!loading && !filtered.length && <p>No hay fichas con estos filtros.</p>}
    <div className="aff-toolbar"><button disabled={currentPage===0} onClick={()=>setPage(currentPage-1)}>Anterior</button><span>Página {currentPage+1} de {pages}</span><button disabled={currentPage+1>=pages} onClick={()=>setPage(currentPage+1)}>Siguiente</button></div>
  </div>
}
