'use client'
import {useEffect,useRef} from 'react'

export default function AffiliateDeleteDialog({name,busy,error,onCancel,onConfirm}:{name:string;busy:boolean;error:string;onCancel:()=>void;onConfirm:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),cancel=useRef<HTMLButtonElement>(null)
 useEffect(()=>{const modal=dialog.current,previous=document.activeElement;modal?.showModal();cancel.current?.focus();return()=>{modal?.close();if(previous instanceof HTMLElement&&previous.isConnected)previous.focus()}},[])
 return <dialog ref={dialog} className="aff-delete-dialog" aria-labelledby="affiliate-delete-title" aria-describedby="affiliate-delete-description" onCancel={event=>{event.preventDefault();if(!busy)onCancel()}}>
  <h2 id="affiliate-delete-title">¿Borrar esta ficha de afiliación?</h2>
  <p className="aff-delete-name">{name}</p>
  <p id="affiliate-delete-description">Se eliminarán definitivamente la ficha y todas sus gestiones. Esta acción no se puede deshacer.</p>
  <p>Si solo quieres registrar una baja y conservar sus datos, cancela y utiliza «Pasar a bajas».</p>
  {error&&<p className="auth-error" role="alert">{error}</p>}
  <div className="notification-actions"><button ref={cancel} type="button" className="button button-secondary" disabled={busy} onClick={onCancel}>Cancelar</button><button type="button" className="button aff-delete-confirm" disabled={busy} onClick={onConfirm}>{busy?'Borrando…':'Borrar definitivamente'}</button></div>
 </dialog>
}
