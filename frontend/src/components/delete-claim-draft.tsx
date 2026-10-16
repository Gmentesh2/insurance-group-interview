'use client';
import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Dialog } from '@base-ui/react/dialog';
import { LoaderCircle, Trash2, X } from 'lucide-react';
import type { Claim } from '@/lib/contracts';
import { api, RequestError } from '@/lib/client';
import { deletePrivateDraft, getPrivateSessionEpoch } from '@/lib/private-drafts';
import { ErrorNotice, errorCode } from './account-feedback';

export function DeleteClaimDraft({claim,ownerId,disabled=false}:{claim:Claim;ownerId:string;disabled?:boolean}) {
 const t=useTranslations('passwordAuth'),common=useTranslations('common'),locale=useLocale(),router=useRouter();
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const request=useRef<AbortController|null>(null);
 useEffect(()=>()=>request.current?.abort(),[]);
 if(claim.status!=='draft')return null;
 function finish(){deletePrivateDraft(ownerId,`claim-edit:${claim.id}`);deletePrivateDraft(ownerId,`claim-upload:${claim.id}`);router.push(`/${locale}/account/claims`);}
 async function remove(){
  if(request.current)return;
  const controller=new AbortController();request.current=controller;const epoch=getPrivateSessionEpoch();setBusy(true);setError('');
  try {await api(`/claims/${claim.id}`,{method:'DELETE',body:JSON.stringify({expectedUpdatedAt:claim.updatedAt}),signal:controller.signal});if(!controller.signal.aborted&&epoch===getPrivateSessionEpoch())finish();}
  catch(e){
   if(controller.signal.aborted)return;
   // Confirm uncertain deletion with a read; never automatically repeat the DELETE.
   if(!(e instanceof RequestError)||e.status>=500){try{await api(`/claims/${claim.id}`,{signal:controller.signal});}catch(check){if(check instanceof RequestError&&check.status===404&&epoch===getPrivateSessionEpoch()){finish();return;}}}
   if(!controller.signal.aborted)setError(errorCode(e));
  }finally{if(!controller.signal.aborted){request.current=null;setBusy(false);}}
 }
 return <div className="claim-delete-draft"><Dialog.Root open={open} onOpenChange={value=>{if(!busy){setOpen(value);setError('');}}}>
  <Dialog.Trigger className="account-text-link" disabled={disabled}><Trash2 size={17} aria-hidden="true"/>{t('deleteDraft')}</Dialog.Trigger>
  <Dialog.Portal><Dialog.Backdrop className="dialog-backdrop"/><Dialog.Popup className="dialog-popup claim-picker"><Dialog.Close className="icon-button claim-dialog-close" aria-label={common('close')} disabled={busy}><X size={20} aria-hidden="true"/></Dialog.Close><Dialog.Title className="dialog-title">{t('deleteTitle')}</Dialog.Title><Dialog.Description>{t('deleteHint')}</Dialog.Description>{error&&<ErrorNotice code={error}/>}<div className="claim-flow-actions"><button className="button button-danger" disabled={busy} onClick={()=>void remove()}>{busy&&<LoaderCircle size={18} className="spin" aria-hidden="true"/>}{t(busy?'deleting':'confirmDelete')}</button><Dialog.Close className="button button-secondary" disabled={busy}>{t('cancel')}</Dialog.Close></div></Dialog.Popup></Dialog.Portal>
 </Dialog.Root></div>;
}
