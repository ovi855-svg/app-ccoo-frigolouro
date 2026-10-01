'use client'
import {useState, useEffect, useRef, useId} from 'react'
import AppIcon from './AppIcon'
interface EditableTextProps {
 initialValue: string; onSave: (value: string)=>Promise<void>; isTextArea?: boolean; className?: string; style?: React.CSSProperties; placeholder?: string; label?: string; options?: readonly string[]
}
export default function EditableText({initialValue,onSave,isTextArea=false,className='',style={},placeholder='Añadir texto…',label='texto',options}: EditableTextProps) {
 const [editing,setEditing]=useState(false), [value,setValue]=useState(initialValue), [saving,setSaving]=useState(false), [error,setError]=useState('')
 const input=useRef<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>(null)
 const id=useId()
 useEffect(()=>{setValue(initialValue)},[initialValue])
 useEffect(()=>{if(editing)input.current?.focus()},[editing])
 function cancel(){setValue(initialValue);setEditing(false);setError('')}
 async function save(){
  if(value.trim()===initialValue){setEditing(false);return}
  setSaving(true);setError('')
  try{await onSave(value);setEditing(false)}catch{setError('No se pudo guardar. Revisa el texto e inténtalo de nuevo.')}finally{setSaving(false)}
 }
 function keyDown(e: React.KeyboardEvent){if(saving)return;if(e.key==='Escape')cancel();if(e.key==='Enter'&&!isTextArea&&!e.shiftKey){e.preventDefault();void save()}}
 if(editing)return <div className={`editable-text-container ${className}`}>
  {options?<select ref={input as React.RefObject<HTMLSelectElement>} aria-label={`Editar ${label}`} value={value} disabled={saving} onChange={e=>setValue(e.target.value)} onKeyDown={keyDown}>{options.map(s=><option key={s}>{s}</option>)}</select>:isTextArea?<textarea ref={input as React.RefObject<HTMLTextAreaElement>} aria-label={`Editar ${label}`} value={value} disabled={saving} onChange={e=>setValue(e.target.value)} onKeyDown={keyDown} rows={4} placeholder={placeholder}/>:<input ref={input as React.RefObject<HTMLInputElement>} aria-label={`Editar ${label}`} value={value} disabled={saving} onChange={e=>setValue(e.target.value)} onKeyDown={keyDown} placeholder={placeholder}/>}
  {error&&<p id={`${id}-error`} role="alert" className="auth-error">{error}</p>}
  <div className="edit-actions"><button type="button" className="button button-primary" onClick={()=>void save()} disabled={saving}>{saving?'Guardando…':'Guardar'}</button><button type="button" className="button button-secondary" onClick={cancel} disabled={saving}>Cancelar</button></div>
 </div>
 return <div className={`editable-text-preview ${className}`} style={style}><span className={value?'editable-value':'editable-placeholder'}>{value||placeholder}</span><button type="button" className="edit-trigger" onClick={()=>setEditing(true)} aria-label={`Editar ${label}`}><AppIcon name="edit" size={16}/><span>Editar</span></button></div>
}
