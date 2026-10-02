'use client'
import Link from 'next/link'
import {useEffect,useState} from 'react'
import {createClient} from '@/lib/supabase'
import AppIcon from './AppIcon'

export default function NotificationBell(){
 const [count,setCount]=useState(0)
 useEffect(()=>{
  let cancelled=false
  async function refresh(){
   if(document.hidden)return
   const {count,error}=await createClient().from('notifications').select('id',{count:'exact',head:true}).is('read_at',null)
   if(!cancelled&&!error)setCount(count||0)
  }
  void refresh();const timer=window.setInterval(()=>void refresh(),30000)
  window.addEventListener('focus',refresh);window.addEventListener('notifications-updated',refresh)
  return()=>{cancelled=true;clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener('notifications-updated',refresh)}
 },[])
 return <Link href="/avisos" className="notification-bell" aria-label={count?`Avisos: ${count} sin leer`:'Avisos'}><AppIcon name="bell"/>{count>0&&<span className="notification-badge" aria-hidden="true">{count>99?'99+':count}</span>}</Link>
}
