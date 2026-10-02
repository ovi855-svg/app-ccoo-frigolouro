import type {MetadataRoute} from 'next'
export default function manifest():MetadataRoute.Manifest{
 return {name:'CCOO Frigolouro',short_name:'CCOO Frigolouro',description:'Gestión sindical privada',start_url:'/',scope:'/',display:'standalone',background_color:'#ffffff',theme_color:'#da291c',lang:'es',icons:[{src:'/pwa-icon/192',sizes:'192x192',type:'image/png',purpose:'any'},{src:'/pwa-icon/512',sizes:'512x512',type:'image/png',purpose:'any'}]}
}
