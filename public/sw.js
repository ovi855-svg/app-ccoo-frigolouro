/* Push only: no fetch handler, offline cache, credentials or personal records. */
self.addEventListener('install',()=>self.skipWaiting())
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()))
self.addEventListener('push',event=>{
 const data=event.data?.json()||{}
 const routes=['/orden-del-dia','/metodos-tiempos','/salud-laboral','/afiliados','/avisos']
 let href='/avisos'
 try{const target=new URL(data.href,self.location.origin);if(target.origin===self.location.origin&&routes.includes(target.pathname))href=target.pathname+target.hash}catch{}
 event.waitUntil(self.registration.showNotification('CCOO Frigolouro',{body:data.body||'Hay novedades en la aplicación.',icon:'/pwa-icon/192',tag:data.tag||'union-update',data:{href},renotify:false}))
})
self.addEventListener('notificationclick',event=>{
 event.notification.close()
 const target=new URL(event.notification.data?.href||'/avisos',self.location.origin)
 if(target.origin!==self.location.origin)return
 event.waitUntil((async()=>{
  const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true})
  for(const client of windows){if(new URL(client.url).origin===self.location.origin){await client.navigate(target.href);await client.focus();return}}
  await self.clients.openWindow(target.href)
 })())
})
self.addEventListener('message',event=>{
 if(event.data?.type==='CLEAR_NOTIFICATIONS')event.waitUntil(self.registration.getNotifications().then(notices=>notices.forEach(n=>n.close())))
})
