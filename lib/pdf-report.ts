import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {AFFILIATION_FIELDS,displayField} from './affiliation'
import {creationAuthor} from './authorship'
import type {Afiliado,AuthorStamp} from './types'

export type ReportBrand = {data: string; width: number; height: number}
export type ReportOptions = {title: string; startDate?: string; endDate?: string; section?: string; state?: string; generatedAt?: Date}
export type ReportRecord = AuthorStamp & {id: number|string; titulo: string; seccion: string; estado: string; created_at: string; descripcion?: string|null; contestacion?: string|null; creada_por?: string|null; history?: {created_at: string; label: string; created_by_name?: string|null}[]}
const RED: [number,number,number]=[218,41,28]
const BLACK: [number,number,number]=[29,29,29]
const GREY: [number,number,number]=[91,91,91]
const MARGIN=20,WIDTH=170,TOP=52,BOTTOM=269

export async function loadReportBrand(): Promise<ReportBrand> {
  const response=await fetch('/brand/ccoo-frigolouro-rojo.png')
  if(!response.ok)throw new Error('No se pudo cargar el logo oficial')
  const data=await new Promise<string>((resolve,reject)=>{
    response.blob().then(blob=>{
      const reader=new FileReader()
      reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(blob)
    }).catch(reject)
  })
  return new Promise((resolve,reject)=>{
    const image=new Image()
    image.onload=()=>resolve({data,width:image.naturalWidth,height:image.naturalHeight})
    image.onerror=reject;image.src=data
  })
}
function clean(value: string) {return value.replace(/[—–]/g,'-').replace(/\u00a0/g,' ')}
function date(value: string) {return new Date(value.includes('T')?value:value+'T12:00:00').toLocaleDateString('es-ES')}

class InternalReport {
  doc=new jsPDF({format:'a4',unit:'mm'})
  y=TOP
  constructor(private options: ReportOptions,private brand: ReportBrand) {
    this.doc.setProperties({title:options.title,author:'Sección Sindical de CCOO en Frigolouro',subject:'Documento interno de gestión sindical'})
  }
  room(height: number) {if(this.y+height>BOTTOM){this.doc.addPage();this.y=TOP}}
  heading(text: string,size=13) {
    this.doc.setFont('helvetica','bold');this.doc.setFontSize(size)
    const lines=this.doc.splitTextToSize(clean(text),WIDTH) as string[]
    // Keep headings with at least two lines of the following content.
    this.room(Math.min(lines.length*size*.45+13,BOTTOM-TOP))
    this.text(text,size,true,false,BLACK);this.y+=3
  }
  text(text: string,size=10.5,bold=false,justify=true,color: [number,number,number]=BLACK) {
    this.doc.setFont('helvetica',bold?'bold':'normal');this.doc.setFontSize(size);this.doc.setTextColor(...color)
    const lineHeight=size*.352778*1.35
    for(const paragraph of clean(text || 'Sin dato').split(/\n/)) {
      if(!paragraph.trim()){this.y+=lineHeight;continue}
      let lines=this.doc.splitTextToSize(paragraph,WIDTH) as string[]
      while(lines.length){
        this.room(lineHeight)
        const fit=Math.max(1,Math.floor((BOTTOM-this.y)/lineHeight))
        const chunk=lines.slice(0,fit)
        this.doc.text(chunk,MARGIN,this.y,{maxWidth:WIDTH,align:justify?'justify':'left',lineHeightFactor:1.35})
        this.y+=chunk.length*lineHeight;lines=lines.slice(fit)
        if(lines.length){this.doc.addPage();this.y=TOP}
      }
    }
    this.y+=3
  }
  table(head: string[],body: (string|number)[][],firstWidth?: number) {
    this.room(22)
    autoTable(this.doc,{
      startY:this.y,head:head.length?[head]:undefined,body,theme:'grid',
      margin:{left:MARGIN,right:MARGIN,top:TOP,bottom:28},
      styles:{font:'helvetica',fontSize:10,cellPadding:3,overflow:'linebreak',textColor:BLACK,lineColor:[225,225,225],lineWidth:.15},
      headStyles:{fillColor:RED,textColor:[255,255,255],fontStyle:'bold'},
      alternateRowStyles:{fillColor:[249,249,249]},
      columnStyles:firstWidth?{0:{cellWidth:firstWidth,fontStyle:'bold'}}:{},
      rowPageBreak:'avoid',showHead:'everyPage',
    })
    this.y=(this.doc as jsPDF&{lastAutoTable:{finalY:number}}).lastAutoTable.finalY+9
  }
  introduction(total: number) {
    this.heading(this.options.title,18)
    const {startDate,endDate,section,state}=this.options
    if(startDate&&endDate)this.text(`Registros del ${date(startDate)} al ${date(endDate)}`,9,false,false,GREY)
    if(section&&section!=='TODAS')this.text(`Sección: ${section}`,9,false,false,GREY)
    if(state&&state!=='TODAS')this.text(`Estado: ${state}`,9,false,false,GREY)
    this.text(`Total: ${total} ${total===1?'registro':'registros'}`,9,true,false)
  }
  authorship(record: AuthorStamp&{creada_por?:string|null}) {
    this.text(creationAuthor(record),9,false,false,GREY)
    if(record.updated_by_name&&record.updated_at)this.text(`Último cambio: ${record.updated_by_name} - ${new Date(record.updated_at).toLocaleString('es-ES')}`,9,false,false,GREY)
  }
  finish() {
    const pages=this.doc.getNumberOfPages(), generated=this.options.generatedAt||new Date()
    for(let page=1;page<=pages;page++){
      this.doc.setPage(page)
      // Use the exact official transparent image, at its natural aspect ratio.
      const width=34,height=width*this.brand.height/this.brand.width
      this.doc.addImage(this.brand.data,'PNG',MARGIN,12,width,height)
      this.doc.setFont('helvetica','bold');this.doc.setFontSize(10);this.doc.setTextColor(...BLACK)
      this.doc.text('Sección Sindical de CCOO en Frigolouro',190,18,{align:'right'})
      this.doc.setFontSize(9);this.doc.setTextColor(...RED)
      this.doc.text('INFORME INTERNO',190,25,{align:'right'})
      this.doc.setFont('helvetica','normal');this.doc.setTextColor(...BLACK)
      this.doc.text(generated.toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'}),190,32,{align:'right'})
      this.doc.setDrawColor(...RED);this.doc.setLineWidth(.5);this.doc.line(MARGIN,43,190,43)
      this.doc.setDrawColor(210,210,210);this.doc.setLineWidth(.2);this.doc.line(MARGIN,278,190,278)
      this.doc.setFontSize(8);this.doc.setTextColor(...GREY)
      this.doc.text('CCOO Frigolouro · Documento interno',MARGIN,284)
      this.doc.text(`${page} / ${pages}`,190,284,{align:'right'})
    }
    return this.doc
  }
}

export function managementReport(records: ReportRecord[],options: ReportOptions,brand: ReportBrand) {
  const report=new InternalReport(options,brand)
  report.introduction(records.length)
  const counts=new Map<string,number>()
  records.forEach(record=>counts.set(record.seccion,(counts.get(record.seccion)||0)+1))
  report.heading('Resumen por sección')
  report.table(['Sección','Registros'],[...counts.entries()],130)
  report.heading('Detalle y seguimiento')
  for(const [index,record] of records.entries()) {
    report.heading(`${index+1}. ${record.titulo}`,12)
    report.text(`${date(record.created_at)} · ${record.seccion} · Estado: ${record.estado}`,9,true,false)
    report.authorship(record)
    report.heading('Descripción',10.5);report.text(record.descripcion||'Sin descripción registrada.')
    report.heading('Contestación de la empresa',10.5);report.text(record.contestacion||'Sin contestación registrada.')
    if(record.history?.length){
      report.heading('Historial de cambios',10.5)
      report.table(['Fecha','Cambio','Autoría'],record.history.map(h=>[new Date(h.created_at).toLocaleString('es-ES'),h.label,h.created_by_name||'No registrada']),35)
    }
    report.y+=5
  }
  return report.finish()
}

function personDetails(report: InternalReport,person: Afiliado) {
  const rows: string[][]=[['Nombre completo',person.nombre_completo],['Sección',person.seccion],['Afiliación',person.estado_afiliacion==='baja'?'Baja':'Activa'],...AFFILIATION_FIELDS.map(([key,label])=>[label,clean(displayField(person,key))])]
  if(!person.telefono_movil&&!person.telefono_fijo&&person.telefono)rows.push(['Teléfono de la ficha anterior',person.telefono])
  if(person.estado_afiliacion==='baja'){
    rows.push(['Motivo de baja',person.motivo_baja||'Sin dato'])
    if(person.ausencia_detectada_en)rows.push(['Ausencia detectada (no fecha efectiva de baja)',date(person.ausencia_detectada_en)])
  }
  report.authorship(person)
  report.table([],rows,60)
  report.heading('Historial de gestiones',11)
  if(person.gestiones_afiliados?.length){
    report.table(['Fecha','Gestión','Autoría'],[...person.gestiones_afiliados].sort((a,b)=>b.created_at.localeCompare(a.created_at)).map(g=>[date(g.created_at),g.gestion,[g.created_by_name?`Registró: ${g.created_by_name}`:'Autoría anterior no registrada',g.updated_by_name?`Último cambio: ${g.updated_by_name}`:''].filter(Boolean).join('\n')]),30)
  }else report.text('No hay gestiones registradas.',9,false,false,GREY)
}
export function affiliationReport(people: Afiliado[],options: ReportOptions,brand: ReportBrand) {
  const report=new InternalReport(options,brand)
  report.introduction(people.length)
  const counts=new Map<string,number>();people.forEach(p=>counts.set(p.seccion,(counts.get(p.seccion)||0)+1))
  report.heading('Resumen por sección');report.table(['Sección','Personas'],[...counts.entries()],130)
  for(const [index,person] of people.entries()){
    report.heading(`${index+1}. ${person.nombre_completo}`,12);personDetails(report,person)
  }
  return report.finish()
}
export function affiliationRecord(person: Afiliado,brand: ReportBrand,generatedAt?: Date) {
  const report=new InternalReport({title:'Ficha de afiliación',generatedAt},brand)
  report.heading('Ficha de afiliación',18)
  report.heading(person.nombre_completo,12);personDetails(report,person)
  return report.finish()
}
