import {createClient} from './supabase'

export const notificationCategories={incidencias:'Incidencias',metodos:'Métodos y tiempos',salud:'Salud laboral',afiliacion:'Afiliación y gestiones'} as const
export type NotificationCategory=keyof typeof notificationCategories
export type Notice={id:string;actor_name:string;category:NotificationCategory;message:string;href:string;created_at:string;read_at:string|null}
export type NotificationPreferences={push_enabled:boolean;incidencias:boolean;metodos:boolean;salud:boolean;afiliacion:boolean;snoozed_until:string|null}
export const defaultNotificationPreferences:NotificationPreferences={push_enabled:true,incidencias:true,metodos:true,salud:true,afiliacion:true,snoozed_until:null}
export function supportsPush(){return typeof window!=='undefined'&&window.isSecureContext&&'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window}
export function safeNotificationHref(href:string){
 const match=href.match(/^\/(orden-del-dia|metodos-tiempos|salud-laboral|afiliados)(#registro-[a-zA-Z0-9-]+)?$/)
 return match?href:'/avisos'
}
export function notifyInboxChanged(){window.dispatchEvent(new Event('notifications-updated'))}
export async function unregisterPushDevice(){
 if(!supportsPush())return
 const registration=await navigator.serviceWorker.getRegistration('/')
 const subscription=await registration?.pushManager.getSubscription()
 if(!subscription)return
 // Unsubscribe locally even if the network is unavailable. Expired endpoints are removed by the worker.
 try{await createClient().from('push_subscriptions').delete().eq('endpoint',subscription.endpoint)}finally{
  await subscription.unsubscribe()
  registration?.active?.postMessage({type:'CLEAR_NOTIFICATIONS'})
 }
}
export function decodePushKey(key:string){const raw=atob(key.replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(raw,c=>c.charCodeAt(0))}
