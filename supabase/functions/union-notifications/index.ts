import { createClient } from 'npm:@supabase/supabase-js@2.117.2'
import webpush from 'npm:web-push@3.6.7'

const origin='https://app-ccoo-frigolouro.vercel.app'
const url=Deno.env.get('SUPABASE_URL')!
const admin=createClient(url,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}})
const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':origin,'Vary':'Origin'}
const labels:Record<string,string>={incidencias:'Hay novedades en incidencias.',metodos:'Hay novedades en métodos y tiempos.',salud:'Hay novedades en salud laboral.',afiliacion:'Hay novedades en afiliación.'}
function reply(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers})}
async function rpc(name:string,args:Record<string,unknown>={}){
 const {data,error}=await admin.rpc(name,args);if(error)throw new Error('Worker database operation failed');return data
}
function allowedEndpoint(endpoint:string){
 try{const u=new URL(endpoint);return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash&&(!u.port||u.port==='443')&&
 /^(fcm\.googleapis\.com|([a-z0-9-]+\.)?push\.services\.mozilla\.com|web\.push\.apple\.com|([a-z0-9-]+\.)?notify\.windows\.com)$/.test(u.hostname)}catch{return false}
}
async function send(subscription:{endpoint:string;p256dh:string;auth:string},payload:unknown,config:{publicKey:string;privateKey:string},topic:string){
 if(!allowedEndpoint(subscription.endpoint))return 400
 const request=webpush.generateRequestDetails({endpoint:subscription.endpoint,keys:{p256dh:subscription.p256dh,auth:subscription.auth}},JSON.stringify(payload),{
  vapidDetails:{subject:origin,publicKey:config.publicKey,privateKey:config.privateKey},TTL:3600,urgency:'normal',topic,
 })
 const response=await fetch(request.endpoint,{method:'POST',headers:request.headers,body:new Uint8Array(request.body),redirect:'error',signal:AbortSignal.timeout(8000)})
 await response.body?.cancel()
 return response.status
}
Deno.serve(async(req:Request)=>{
 if(req.headers.get('Origin')&&req.headers.get('Origin')!==origin)return reply({error:'Origin not allowed'},403)
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info'}})
 if(req.method!=='POST')return reply({error:'Method not allowed'},405)
 try{
  const raw=await req.text();if(raw.length>4096)return reply({error:'Request too large'},413)
  const body=JSON.parse(raw);let config:any;let userId:string|undefined
  if(body.action==='deliver'){
   config=await rpc('notification_worker_config')
   if(!req.headers.get('x-job-token')||req.headers.get('x-job-token')!==config.jobToken)return reply({error:'Not authorized'},401)
  }else{
   const token=req.headers.get('Authorization')?.match(/^Bearer (.+)$/)?.[1]
   if(!token)return reply({error:'Sign in required'},401)
   const {data:{user},error}=await admin.auth.getUser(token)
   if(error||!user)return reply({error:'Sign in required'},401)
   const member=await admin.from('app_members').select('user_id').eq('user_id',user.id).eq('active',true).maybeSingle()
   if(member.error||!member.data)return reply({error:'Not authorized'},403)
   userId=user.id
   if(!['config','test'].includes(body.action))return reply({error:'Invalid action'},400)
   config=await rpc('notification_worker_config')
  }
  if(!config.publicKey){
   const keys=webpush.generateVAPIDKeys()
   // Verify encryption support in the Edge runtime, without sending a message.
   webpush.generateRequestDetails({endpoint:'https://fcm.googleapis.com/fcm/send/self-check',keys:{p256dh:keys.publicKey,auth:btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}},
    'Runtime self-check',{vapidDetails:{subject:origin,publicKey:keys.publicKey,privateKey:keys.privateKey}})
   config=await rpc('notification_worker_config',{p_public:keys.publicKey,p_private:keys.privateKey})
  }
  if(body.action==='config')return reply({publicKey:config.publicKey})
  if(body.action==='test'){
   if(typeof body.endpoint!=='string')return reply({error:'Device not registered'},400)
   const {data:sub,error}=await admin.from('push_subscriptions').select('id,endpoint,p256dh,auth').eq('user_id',userId!).eq('endpoint',body.endpoint).maybeSingle()
   if(error||!sub)return reply({error:'Device not registered'},404)
   // An explicit test is the only self-notification; real activity excludes the actor.
   const status=await send(sub,{title:'CCOO Frigolouro',body:'Aviso de prueba. Las notificaciones están activadas.',href:'/avisos',tag:'union-test'},config,'union-test')
   if(status===404||status===410)await admin.from('push_subscriptions').delete().eq('id',sub.id)
   return status>=200&&status<300?reply({sent:true}):reply({error:'Could not deliver test. Activate this device again.'},502)
  }
  const jobs=await rpc('claim_notification_deliveries');let delivered=0
  await Promise.all(jobs.map(async(job:any)=>{
   let status=503
   try{status=await send(job,{title:'CCOO Frigolouro',body:labels[job.category]||'Hay novedades en la aplicación.',href:job.href,tag:'union-'+job.category},config,'union-'+job.category)}catch{/* Retry without logging endpoints or payloads. */}
   await rpc('finish_notification_delivery',{p_id:job.id,p_status:status})
   if(status>=200&&status<300)delivered++
  }))
  return reply({processed:jobs.length,delivered})
 }catch{return reply({error:'Notification service unavailable'},503)}
})
