import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {creationAuthor} from './authorship'
import type {ReportBrand,ReportOptions,ReportRecord} from './pdf-report'

const RED: [number,number,number]=[218,41,28]
const INK: [number,number,number]=[29,29,29]
const GREY: [number,number,number]=[91,91,91]
const LIGHT: [number,number,number]=[245,245,245]
const LEFT=18,WIDTH=174,TOP=42,BOTTOM=270
const clean=(value:string)=>value.replace(/[—–]/g,'-').replace(/\u00a0/g,' ')
const date=(value:string)=>new Date(value.includes('T')?value:value+'T12:00:00').toLocaleDateString('es-ES')

/** Meeting reports: clear hierarchy and pagination, independent of affiliation PDFs. */
export class ManagementReportLayout {
  doc=new jsPDF({format:'a4',unit:'mm'})
  private y=TOP
  private section=''
  private point=0
  private contexts=new Map<number,{section:string;point:number}>()
  constructor(private options:ReportOptions,private brand:ReportBrand){
    this.doc.setProperties({title:options.title,author:'Sección Sindical de CCOO en Frigolouro',subject:'Documento interno de gestión sindical'})
  }
  private room(height:number){
    if(this.y+height>BOTTOM){this.doc.addPage();this.y=TOP;this.rememberPage()}
  }
  private rememberPage(){
    const page=this.doc.getCurrentPageInfo().pageNumber
    if(!this.contexts.has(page))this.contexts.set(page,{section:this.section,point:this.point})
  }
  private lines(text:string,size:number,bold=false,width=WIDTH){
    this.doc.setFont('helvetica',bold?'bold':'normal');this.doc.setFontSize(size)
    // Leave a small buffer for differences between PDF readers' font metrics.
    return this.doc.splitTextToSize(clean(text),width-.75) as string[]
  }
  private text(text:string,size=10,bold=false,color:[number,number,number]=INK,width=WIDTH,x=LEFT){
    const lineHeight=size*.352778*1.28
    this.doc.setFont('helvetica',bold?'bold':'normal');this.doc.setFontSize(size);this.doc.setTextColor(...color)
    for(const paragraph of clean(text).split('\n')){
      if(!paragraph.trim()){this.room(lineHeight);this.y+=lineHeight;continue}
      let lines=this.lines(paragraph,size,bold,width)
      while(lines.length){
        this.room(lineHeight)
        const fit=Math.max(1,Math.floor((BOTTOM-this.y)/lineHeight)),chunk=lines.slice(0,fit)
        this.doc.text(chunk,x,this.y,{lineHeightFactor:1.28})
        this.y+=chunk.length*lineHeight;lines=lines.slice(fit)
      }
    }
  }
  introduction(total:number,sections:[string,ReportRecord[]][]){
    this.text(this.options.title,18,true);this.y+=3
    const {startDate,endDate,section,state}=this.options
    const filters=[startDate&&endDate?`Registros del ${date(startDate)} al ${date(endDate)}`:'',section&&section!=='TODAS'?`Sección: ${section}`:'',state&&state!=='TODAS'?`Estado: ${state}`:'',`Total: ${total} ${total===1?'registro':'registros'}`].filter(Boolean)
    this.text(filters.join(' · '),9,false,GREY);this.y+=3
    if(sections.length){this.text(`Distribución por sección: ${sections.map(([name,group])=>`${name} (${group.length})`).join(' · ')}`,8.5,false,GREY);this.y+=6}
    else{this.y+=6;this.text('No hay registros con los filtros seleccionados.',11)}
  }
  sectionHeading(section:string,total:number,first:ReportRecord,index:number){
    this.section=section;this.point=0
    const lines=this.lines(`Sección: ${section}`,10.5,true,139),height=Math.max(10,lines.length*4.8+5)
    this.room(height+5+this.startHeight(first,index))
    this.doc.setFillColor(...RED);this.doc.roundedRect(LEFT,this.y,WIDTH,height,1,1,'F')
    this.doc.setFont('helvetica','bold');this.doc.setFontSize(10.5);this.doc.setTextColor(255,255,255)
    this.doc.text(lines,LEFT+4,this.y+6.5,{lineHeightFactor:1.28})
    this.doc.setFontSize(8.5);this.doc.text(`${total} ${total===1?'registro':'registros'}`,LEFT+WIDTH-4,this.y+6.5,{align:'right'})
    this.y+=height+5
  }
  private author(record:ReportRecord){
    return [creationAuthor(record),record.updated_by_name&&record.updated_at?`Último cambio: ${record.updated_by_name} - ${new Date(record.updated_at).toLocaleString('es-ES')}`:''].filter(Boolean).join('\n')
  }
  private metadata(record:ReportRecord){return `Fecha: ${date(record.created_at)} · Estado: ${record.estado}`}
  private prefixHeight(record:ReportRecord,index:number){
    return this.lines(`${index}. ${record.titulo}`,12.5,true).length*5.65+3+
      this.lines(this.metadata(record),9,true,WIDTH-8).length*4.1+6+
      this.author(record).split('\n').reduce((n,line)=>n+this.lines(line,8.5).length*3.84,0)+4
  }
  private startHeight(record:ReportRecord,index:number){return Math.min(this.prefixHeight(record,index)+15,85)}
  record(record:ReportRecord,index:number){
    this.point=index
    const previousPage=this.doc.getCurrentPageInfo().pageNumber
    this.room(this.startHeight(record,index))
    if(this.doc.getCurrentPageInfo().pageNumber!==previousPage){
      this.contexts.set(this.doc.getCurrentPageInfo().pageNumber,{section:this.section,point:0})
    }
    this.text(`${index}. ${record.titulo}`,12.5,true);this.y+=2.5
    const meta=this.metadata(record),height=this.lines(meta,9,true,WIDTH-8).length*4.1+4
    this.room(height)
    this.doc.setFillColor(...LIGHT);this.doc.roundedRect(LEFT,this.y-2,WIDTH,height,1,1,'F')
    this.y+=2;this.text(meta,9,true,INK,WIDTH-8,LEFT+4);this.y+=3
    this.text(this.author(record),8.5,false,GREY);this.y+=3
    this.block('Descripción',record.descripcion||'Sin descripción registrada.')
    this.block('Contestación de la empresa',record.contestacion||'Sin contestación registrada.')
    if(record.history?.length){
      this.label('Historial de cambios',14)
      autoTable(this.doc,{
        startY:this.y,head:[['Fecha','Cambio','Autoría']],body:record.history.map(h=>[new Date(h.created_at).toLocaleString('es-ES'),clean(h.label),clean(h.created_by_name||'No registrada')]),
        theme:'plain',margin:{left:LEFT,right:LEFT,top:TOP,bottom:297-BOTTOM},
        styles:{font:'helvetica',fontSize:8.8,cellPadding:1.25,overflow:'linebreak',textColor:INK,valign:'top'},
        headStyles:{fillColor:[235,235,235],textColor:INK,fontStyle:'bold'},alternateRowStyles:{fillColor:LIGHT},
        columnStyles:{0:{cellWidth:34},1:{cellWidth:106},2:{cellWidth:34}},rowPageBreak:'avoid',showHead:'everyPage',
        didDrawPage:()=>this.rememberPage(),
      })
      this.y=(this.doc as jsPDF&{lastAutoTable:{finalY:number}}).lastAutoTable.finalY+4
    }
    if(this.y+3<=BOTTOM){this.doc.setDrawColor(220,220,220);this.doc.setLineWidth(.2);this.doc.line(LEFT,this.y,LEFT+WIDTH,this.y)}
    this.y+=6
  }
  private label(label:string,following=9){
    this.room(5+following);this.text(label,9.5,true);this.y+=1
  }
  private block(label:string,value:string){this.label(label);this.text(value);this.y+=2.5}
  finish(){
    const pages=this.doc.getNumberOfPages(),generated=this.options.generatedAt||new Date()
    for(let page=1;page<=pages;page++){
      this.doc.setPage(page)
      const width=28,height=width*this.brand.height/this.brand.width
      this.doc.addImage(this.brand.data,'PNG',LEFT,9,width,height)
      this.doc.setFont('helvetica','bold');this.doc.setFontSize(9);this.doc.setTextColor(...INK)
      this.doc.text('Sección Sindical de CCOO en Frigolouro',LEFT+WIDTH,14,{align:'right'})
      this.doc.setFontSize(8);this.doc.setTextColor(...RED);this.doc.text('INFORME INTERNO',LEFT+WIDTH,19,{align:'right'})
      this.doc.setFont('helvetica','normal');this.doc.setFontSize(8.5);this.doc.setTextColor(...GREY)
      this.doc.text(generated.toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'}),LEFT+WIDTH,24,{align:'right'})
      this.doc.setDrawColor(...RED);this.doc.setLineWidth(.5);this.doc.line(LEFT,31.5,LEFT+WIDTH,31.5)
      const context=this.contexts.get(page)
      if(page>1&&context?.section){
        this.doc.setFont('helvetica','normal');this.doc.setFontSize(8)
        let label=clean(`SECCIÓN: ${context.section}${context.point?` · Continuación del punto ${context.point}`:''}`)
        if(this.doc.getTextWidth(label)>WIDTH-2){
          while(this.doc.getTextWidth(label+'...')>WIDTH-2)label=label.slice(0,-1)
          label+='...'
        }
        this.doc.setTextColor(...GREY);this.doc.text(label,LEFT,37)
      }
      this.doc.setDrawColor(210,210,210);this.doc.setLineWidth(.2);this.doc.line(LEFT,278,LEFT+WIDTH,278)
      this.doc.setFontSize(8);this.doc.setTextColor(...GREY);this.doc.text('CCOO Frigolouro · Documento interno',LEFT,284)
      this.doc.text(`${page} / ${pages}`,LEFT+WIDTH,284,{align:'right'})
    }
    return this.doc
  }
}
