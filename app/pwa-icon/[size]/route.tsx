import {ImageResponse} from 'next/og'
import {readFile} from 'node:fs/promises'
import path from 'node:path'
export async function GET(_request:Request,{params}:{params:Promise<{size:string}>}){
 const {size:requested}=await params
 if(!['192','512'].includes(requested))return new Response('Not found',{status:404})
 const size=Number(requested),logo=await readFile(path.join(process.cwd(),'public/brand/ccoo-frigolouro-rojo.png'))
 return new ImageResponse(<div style={{display:'flex',width:'100%',height:'100%',alignItems:'center',justifyContent:'center',background:'transparent'}}><img alt="CCOO" src={'data:image/png;base64,'+logo.toString('base64')} width={size*.8} height={size*.8*76/130}/></div>,{width:size,height:size})
}
