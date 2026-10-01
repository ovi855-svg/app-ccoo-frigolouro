'use client'
import {useEffect,useState} from 'react'
import {createClient} from '@/lib/supabase'
import {fieldLabels} from '@/lib/authorship'
import type {ActivityEntry} from '@/lib/types'

function action(entry: ActivityEntry) {
  if(entry.table_name==='gestiones_afiliados') return entry.operation==='INSERT'?'Añadió una gestión':entry.operation==='DELETE'?'Eliminó una gestión':'Editó una gestión'
  if(entry.operation==='INSERT') return entry.table_name==='afiliados'?'Creó la ficha':'Creó el registro'
  if(entry.operation==='DELETE') return 'Eliminó el registro'
  const fields=entry.changed_fields.map(key=>fieldLabels[key]).filter(Boolean)
  return fields.length?`Actualizó: ${fields.join(', ')}`:'Guardó sin cambios de contenido'
}
export default function ActivityTrail({resource,id,revision}: {resource: string; id: string; revision?: string}) {
  const [open,setOpen]=useState(false),[entries,setEntries]=useState<ActivityEntry[]>([])
  const [page,setPage]=useState(0),[more,setMore]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(false),[retry,setRetry]=useState(0)
  useEffect(()=>{setPage(0);setEntries([])},[resource,id,revision])
  useEffect(()=>{
    if(!open)return
    let cancelled=false
    setLoading(true);setError(false)
    void (async()=>{
      try {
        const {data,error}=await createClient().from('registro_actividad').select('*')
          .eq('resource_table',resource).eq('resource_id',id)
          .in('table_name',resource==='afiliados'?[resource,'gestiones_afiliados']:[resource])
          .order('created_at',{ascending:false}).order('id').range(page*20,page*20+20)
        if(error)throw error
        if(!cancelled){setEntries(previous=>page===0?data.slice(0,20):[...previous,...data.slice(0,20)]);setMore(data.length>20)}
      }catch{if(!cancelled)setError(true)}finally{if(!cancelled)setLoading(false)}
    })()
    return ()=>{cancelled=true}
  },[open,resource,id,page,revision,retry])
  return <details className="activity-trail" onToggle={e=>{setOpen(e.currentTarget.open);if(e.currentTarget.open){setPage(0);setEntries([])}}}>
    <summary>Quién hizo cada cambio</summary>
    {open&&<div>
      <p className="aff-note">La autoría automática se registra desde la actualización de esta función. Los cambios anteriores conservan los datos que ya tenían.</p>
      {entries.length>0&&<ol>{entries.map(entry=><li key={entry.id}><strong>{entry.actor_name}</strong><span>{action(entry)}</span><time dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleString('es-ES')}</time></li>)}</ol>}
      {loading&&<p role="status">Cargando cambios…</p>}
      {error&&<p role="alert">No se pudo cargar la actividad. <button type="button" onClick={()=>setRetry(retry+1)}>Reintentar</button></p>}
      {!loading&&!error&&!entries.length&&<p className="aff-note">No hay cambios registrados con autoría automática.</p>}
      {!loading&&more&&!error&&<button type="button" className="button button-secondary" onClick={()=>setPage(page+1)}>Ver cambios anteriores</button>}
    </div>}
  </details>
}
