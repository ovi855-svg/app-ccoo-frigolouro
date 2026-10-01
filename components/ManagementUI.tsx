'use client'
import Link from 'next/link'
import {useId} from 'react'
import {SECCIONES} from '@/lib/constants'
import AppIcon from './AppIcon'
import EditableText from './EditableText'

export function ManagementToolbar({createHref, createLabel, reportHref}: {createHref: string; createLabel: string; reportHref: string}) {
 return <div className="management-toolbar"><Link className="button button-primary" href={createHref}><AppIcon name="plus" size={19}/>{createLabel}</Link><Link className="button button-secondary" href={reportHref}><AppIcon name="document" size={19}/>Informe PDF</Link></div>
}
export function ManagementFilters({section, state, search, states, onSection, onState, onSearch, reset}: {section: string; state: string; search: string; states: readonly string[]; onSection: (v: string)=>void; onState: (v: string)=>void; onSearch: (v: string)=>void; reset: ()=>void}) {
 const id=useId()
 const filtered=section!=='TODAS'||state!=='TODOS'||!!search
 return <section className="filters-container" aria-label="Buscar y filtrar registros">
  <label className="search-field" htmlFor={`${id}-search`}>Buscar<div className="search-control"><AppIcon name="search" size={20}/><input id={`${id}-search`} type="search" placeholder="Buscar en título o descripción" value={search} onChange={e=>onSearch(e.target.value)}/></div></label>
  <label htmlFor={`${id}-section`}>Sección<select id={`${id}-section`} value={section} onChange={e=>onSection(e.target.value)}><option value="TODAS">Todas</option>{SECCIONES.map(s=><option key={s}>{s}</option>)}</select></label>
  <label htmlFor={`${id}-state`}>Estado<select id={`${id}-state`} value={state} onChange={e=>onState(e.target.value)}><option value="TODOS">Todos</option>{states.map(s=><option key={s}>{s}</option>)}</select></label>
  {filtered&&<button type="button" className="filter-reset" onClick={reset}>Limpiar filtros</button>}
 </section>
}
export function RecordCard({title, section, description, reply, created, author, state, states, history, onState, onEdit, onDelete}: {title: string; section: string; description: string; reply: string; created: string; author?: string | null; state: string; states: readonly string[]; history: {id: number|string; label: string; date: string}[]; onState: (v:string)=>void; onEdit:(field:'titulo'|'descripcion'|'contestacion',v:string)=>Promise<void>; onDelete:()=>void}) {
 const id=useId()
 const tone=/solucionad/i.test(state)?'resolved':/pendiente/i.test(state)?'pending':/nuev/i.test(state)?'new':'progress'
 return <article className="record-card">
  <div className="record-meta"><span className="section-tag">{section}</span><time dateTime={created}>{new Date(created).toLocaleDateString('es-ES')}</time></div>
  <h2 className="record-title"><EditableText initialValue={title} label="título" onSave={v=>onEdit('titulo',v)} placeholder="Sin título"/></h2>
  <label htmlFor={`${id}-status`} className={`record-status status-${tone}`}><span>Estado</span><select id={`${id}-status`} value={state} onChange={e=>onState(e.target.value)}>{states.map(s=><option key={s}>{s}</option>)}</select></label>
  <p className="record-excerpt">{description || 'Sin descripción. Abre los detalles para añadirla.'}</p>
  <details className="record-details"><summary>Ver detalles y seguimiento<AppIcon name="arrow" size={18}/></summary>
   <div className="record-detail-content"><section><h3>Descripción</h3><EditableText initialValue={description} label="descripción" isTextArea onSave={v=>onEdit('descripcion',v)} placeholder="Añadir descripción…"/></section>
    <section className="company-reply"><h3>Contestación de la empresa</h3><EditableText initialValue={reply} label="contestación de la empresa" isTextArea onSave={v=>onEdit('contestacion',v)} placeholder="Añadir contestación…"/></section>
    <section className="record-history"><h3>Historial</h3><ol>{history.map((h,i)=><li key={`${h.id}-${i}`}><span>{h.label}</span><time dateTime={h.date}>{new Date(h.date).toLocaleString('es-ES')}</time></li>)}<li><span>Creación del registro</span><time dateTime={created}>{new Date(created).toLocaleString('es-ES')}</time></li></ol></section>
    <footer className="record-footer"><span>{author?`Registrado por ${author}`:'Registro de la sección sindical'}</span><button type="button" className="button button-danger" onClick={onDelete}>Eliminar</button></footer>
   </div>
  </details>
 </article>
}
export function EmptyRecords({reset}: {reset:()=>void}) {
 return <div className="empty-state"><AppIcon name="search" size={32}/><h2>No hay registros con estos filtros</h2><p>Prueba con otra búsqueda o consulta el listado completo.</p><button className="button button-secondary" onClick={reset}>Ver todos los registros</button></div>
}
