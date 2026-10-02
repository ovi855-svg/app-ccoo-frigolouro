'use client'
import {useCallback,useEffect,useState} from 'react'
import {createClient} from '@/lib/supabase'
import {notificationCategories,defaultNotificationPreferences,supportsPush,decodePushKey,unregisterPushDevice,safeNotificationHref,notifyInboxChanged,type Notice,type NotificationPreferences,type NotificationCategory} from '@/lib/notifications'

export default function NotificationsManager(){
 const [notices,setNotices]=useState<Notice[]>([]),[prefs,setPrefs]=useState(defaultNotificationPreferences)
 const [loading,setLoading]=useState(true),[error,setError]=useState(''),[feedback,setFeedback]=useState(''),[busy,setBusy]=useState(false)
 const [supported,setSupported]=useState(false),[active,setActive]=useState(false),[page,setPage]=useState(0),[more,setMore]=useState(false)
 const refresh=useCallback(async()=>{
  try{
   const db=createClient()
   const results=await Promise.all([
    db.from('notifications').select('*').order('created_at',{ascending:false}).order('id',{ascending:false}).range(0,(page+1)*20),
    db.from('notification_preferences').select('push_enabled,incidencias,metodos,salud,afiliacion,snoozed_until').maybeSingle(),
   ])
   if(results.some(r=>r.error))throw new Error('load')
   const rows=results[0].data||[];setNotices(rows.slice(0,(page+1)*20));setMore(rows.length>(page+1)*20)
   if(results[1].data)setPrefs(results[1].data as NotificationPreferences)
   setError('')
  }catch{setError('No se pudieron cargar los avisos. Puedes reintentarlo.')}
  finally{setLoading(false)}
 },[page])
 useEffect(()=>{
  void refresh();const timer=window.setInterval(()=>{if(!document.hidden)void refresh()},30000)
  window.addEventListener('focus',refresh)
  return()=>{clearInterval(timer);window.removeEventListener('focus',refresh)}
 },[refresh])
 useEffect(()=>{
  let cancelled=false;const supported=supportsPush();setSupported(supported)
  if(supported)void (async()=>{
   const sub=await (await navigator.serviceWorker.getRegistration('/'))?.pushManager.getSubscription()
   if(sub){const {data}=await createClient().from('push_subscriptions').select('id').eq('endpoint',sub.endpoint).maybeSingle();if(!cancelled)setActive(!!data&&Notification.permission==='granted')}
  })().catch(()=>{})
  return()=>{cancelled=true}
 },[])
 async function savePreferences(next:NotificationPreferences){
  setBusy(true);setError('');setFeedback('')
  try{
   const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user)throw new Error('auth')
   const {error}=await db.from('notification_preferences').upsert({user_id:user.id,...next});if(error)throw error
   setPrefs(next);setFeedback('Preferencias guardadas.')
  }catch{setError('No se pudieron guardar las preferencias. Inténtalo de nuevo.')}
  finally{setBusy(false)}
 }
 async function activate(){
  if(!supportsPush())return
  setBusy(true);setError('');setFeedback('')
  try{
   const permission=await Notification.requestPermission()
   if(permission!=='granted'){setFeedback('Para recibir avisos, permite las notificaciones de esta web en Chrome. La campana seguirá disponible.');return}
   const db=createClient(),{data:{user}}=await db.auth.getUser();if(!user)throw new Error('auth')
   const {data,error}=await db.functions.invoke('union-notifications',{body:{action:'config'}})
   if(error||!data?.publicKey)throw new Error('config')
   await navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'})
   const registration=await Promise.race([navigator.serviceWorker.ready,new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error('timeout')),15000))])
   await unregisterPushDevice()
   const sub=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodePushKey(data.publicKey)})
   const keys=sub.toJSON().keys
   const result=await db.from('push_subscriptions').insert({user_id:user.id,endpoint:sub.endpoint,p256dh:keys?.p256dh,auth:keys?.auth})
   if(result.error){await sub.unsubscribe();throw result.error}
   setActive(true);setFeedback('Este móvil está preparado. Recibirás cambios de las demás personas, nunca los tuyos.')
  }catch{setError('No se pudieron activar los avisos. Comprueba la conexión y los permisos de Chrome e inténtalo de nuevo.')}
  finally{setBusy(false)}
 }
 async function deactivate(){
  setBusy(true);setError('');setFeedback('')
  try{await unregisterPushDevice();setActive(false);setFeedback('Avisos desactivados en este móvil.')}
  catch{setError('No se pudo desactivar este dispositivo. Inténtalo de nuevo.')}
  finally{setBusy(false)}
 }
 async function test(){
  setBusy(true);setError('');setFeedback('')
  try{
   const sub=await (await navigator.serviceWorker.getRegistration('/'))?.pushManager.getSubscription();if(!sub)throw new Error('device')
   const {data,error}=await createClient().functions.invoke('union-notifications',{body:{action:'test',endpoint:sub.endpoint}})
   if(error||!data?.sent)throw new Error('send')
   setFeedback('Aviso de prueba enviado a este móvil. Comprueba las notificaciones de Android.')
  }catch{setError('No se pudo enviar la prueba. Desactiva y vuelve a activar los avisos en este móvil.')}
  finally{setBusy(false)}
 }
 async function markRead(id?:string){
  let query=createClient().from('notifications').update({read_at:new Date().toISOString()}).is('read_at',null)
  if(id)query=query.eq('id',id)
  const {error}=await query
  if(error){setError('No se pudo marcar el aviso como leído.');return false}
  setNotices(rows=>rows.map(n=>!id||n.id===id?{...n,read_at:n.read_at||new Date().toISOString()}:n));notifyInboxChanged();return true
 }
 const snoozed=!!prefs.snoozed_until&&new Date(prefs.snoozed_until)>new Date()
 return <div className="notifications-view">
  <section className="notification-settings" aria-labelledby="push-heading">
   <h2 id="push-heading">Avisos en tu móvil</h2><p>Recibe los cambios de las demás personas. Tus acciones no generan avisos para ti. Los detalles personales se consultan dentro de la app.</p>
   {!supported?<p>Este navegador no permite avisos en el móvil. Prueba con Chrome actualizado; puedes consultar aquí todos los avisos.</p>:<>
    <p className="push-status">{active?'Activados en este móvil':'Sin activar en este móvil'}</p>
    <div className="notification-actions"><button className="button button-primary" disabled={busy} onClick={active?deactivate:activate}>{active?'Desactivar en este móvil':'Activar en este móvil'}</button>{active&&<button className="button button-secondary" disabled={busy} onClick={test}>Enviar aviso de prueba</button>}</div>
   </>}
   <details className="notification-preferences"><summary>Qué avisos quiero recibir</summary>
    <label><input type="checkbox" checked={prefs.push_enabled} disabled={busy||loading} onChange={e=>void savePreferences({...prefs,push_enabled:e.target.checked})}/>Recibir avisos en mis dispositivos</label>
    {(Object.entries(notificationCategories) as [NotificationCategory,string][]).map(([key,label])=><label key={key}><input type="checkbox" checked={prefs[key]} disabled={busy||loading} onChange={e=>void savePreferences({...prefs,[key]:e.target.checked})}/>{label}</label>)}
    <button className="button button-secondary" disabled={busy||loading} onClick={()=>void savePreferences({...prefs,snoozed_until:snoozed?null:new Date(Date.now()+3600000).toISOString()})}>{snoozed?'Quitar silencio':'Silenciar durante una hora'}</button>
    {snoozed&&<p>Silenciados hasta las {new Date(prefs.snoozed_until!).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}.</p>}
    <p>Estas preferencias afectan a los avisos del móvil. La campana conserva todos los cambios. Las importaciones de Excel se agrupan en un único aviso.</p>
   </details>
  </section>
  {feedback&&<p className="notification-feedback" role="status">{feedback}</p>}
  {error&&<p className="auth-error" role="alert">{error} <button className="button button-secondary" onClick={()=>void refresh()}>Reintentar</button></p>}
  <section className="notification-inbox" aria-labelledby="inbox-heading"><div className="notification-inbox-header"><h2 id="inbox-heading">Últimos avisos</h2><button className="button button-secondary" disabled={loading||!notices.some(n=>!n.read_at)} onClick={()=>void markRead()}>Marcar todos como leídos</button></div>
   {loading?<p role="status">Cargando avisos…</p>:!notices.length?<p className="notification-empty">No tienes avisos. Aquí aparecerán los cambios que hagan las demás personas.</p>:<ol>{notices.map(n=><li key={n.id} className={n.read_at?'notice-read':'notice-unread'}><span className="notice-category">{notificationCategories[n.category]}</span><p><strong>{n.actor_name}</strong> · {n.message}</p><time dateTime={n.created_at}>{new Date(n.created_at).toLocaleString('es-ES')}</time><div className="notification-actions"><a href={safeNotificationHref(n.href)} className="button button-secondary" onClick={e=>{e.preventDefault();void markRead(n.id).then(()=>window.location.assign(safeNotificationHref(n.href)))}}>Abrir registro</a>{!n.read_at&&<button className="button button-secondary" onClick={()=>void markRead(n.id)}>Marcar como leído</button>}</div></li>)}</ol>}
   {more&&<button className="button button-secondary" onClick={()=>setPage(page+1)}>Ver avisos anteriores</button>}
  </section>
 </div>
}
