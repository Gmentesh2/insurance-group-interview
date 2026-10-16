'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import type { AuthSession, Policy } from '@/lib/contracts';
import { api } from '@/lib/client';
import { PageIdentity } from './insurance-illustration';

type Message={role:'user'|'model';text:string;sources?:{label:string;href:string}[]};
export function AssistantPage(){
 const t=useTranslations('assistant'),locale=useLocale();
 const [configured,setConfigured]=useState<boolean|null>(null),[loading,setLoading]=useState(false),[failed,setFailed]=useState(false),[messages,setMessages]=useState<Message[]>([]),[question,setQuestion]=useState(''),[pending,setPending]=useState(''),[consent,setConsent]=useState(false),[share,setShare]=useState(false),[policies,setPolicies]=useState<Policy[]>([]),[policyId,setPolicyId]=useState(''),[error,setError]=useState('');
 const request=useRef<AbortController|null>(null),statusRequest=useRef<AbortController|null>(null),field=useRef<HTMLTextAreaElement>(null);
 async function availability(){
  statusRequest.current?.abort();const controller=new AbortController();statusRequest.current=controller;setLoading(true);setFailed(false);
  try{const result=await api<{configured:boolean}>('/assistant/status',{signal:controller.signal});if(!controller.signal.aborted)setConfigured(result.configured);}catch{if(!controller.signal.aborted)setFailed(true);}finally{if(!controller.signal.aborted)setLoading(false);}
 }
 useEffect(()=>{
  void availability();let controller=new AbortController();
  async function loadOwned(){try{const session=await api<AuthSession>('/auth/session',{signal:controller.signal});if(session.user){const data=await api<{policies:Policy[]}>('/policies',{signal:controller.signal});if(!controller.signal.aborted)setPolicies(data.policies);}}catch{/* Public help remains available without an authenticated session. */}}
  void loadOwned();
  const changed=()=>{controller.abort();request.current?.abort();request.current=null;setPending('');setMessages([]);setPolicies([]);setShare(false);setPolicyId('');controller=new AbortController();void loadOwned();};
  window.addEventListener('auth-change',changed);
  return()=>{controller.abort();request.current?.abort();statusRequest.current?.abort();window.removeEventListener('auth-change',changed);};
 },[locale]);
 async function send(event:FormEvent){
  event.preventDefault();if(request.current||!configured||!question.trim())return;
  if(!consent){setError(t('consentRequired'));return;}if(share&&!policyId){setError(t('selectRequired'));return;}
  const controller=new AbortController();request.current=controller;const text=question.trim();setPending(text);setError('');
  try{const result=await api<{reply:string;sources:{label:string;href:string}[]}>('/assistant/chat',{method:'POST',body:JSON.stringify({locale,message:text,history:messages.slice(-8).map(({role,text})=>({role,text:text.slice(0,1500)})),...(share?{policyId,sharePolicy:true}:{})}),signal:controller.signal,timeoutMs:35000});if(!controller.signal.aborted){setMessages(current=>[...current,{role:'user' as const,text},{role:'model' as const,text:result.reply,sources:result.sources}].slice(-20));setQuestion('');requestAnimationFrame(()=>field.current?.focus());}}
  catch{if(!controller.signal.aborted)setError(t('failed'));}finally{if(!controller.signal.aborted){request.current=null;setPending('');}}
 }
 function stop(){request.current?.abort();request.current=null;setPending('');}
 const safeHref=(href:string)=>/^\/(en|de|ru)\/(help(?:#[a-z-]+)?|account\/policies\/[0-9a-f-]{36}(?:#[a-z-]+)?)$/.test(href);
 return <div className="container page-space assistant-page"><PageIdentity illustration="support"><h1>{t('title')}</h1><p>{t('intro')}</p></PageIdentity><p className="assistant-privacy">{t('privacy')}</p>
  {loading&&<p role="status"><LoaderCircle size={18} className="spin" aria-hidden="true"/>{t('sending')}</p>}
  {(configured===false||failed)&&<div className="account-notice" role="status"><p>{t(failed?'failed':'unavailable')}</p><button className="account-text-link" disabled={loading} onClick={()=>void availability()}>{t('retry')}</button></div>}
  <section className="assistant-conversation" aria-label={t('title')} aria-live="polite" aria-busy={!!pending}>{!messages.length&&!pending&&<p className="muted">{t('empty')}</p>}{messages.map((message,index)=><article key={index} className={`assistant-message assistant-${message.role}`}><strong>{t(message.role==='user'?'you':'assistant')}</strong><p>{message.text}</p>{message.sources?.some(s=>safeHref(s.href))&&<nav aria-label={t('sources')}>{message.sources.filter(s=>safeHref(s.href)).map(source=><Link key={source.href} href={source.href}>{source.label}<ArrowRight size={15} aria-hidden="true"/></Link>)}</nav>}</article>)}{pending&&<article className="assistant-message assistant-user"><strong>{t('you')}</strong><p>{pending}</p><small role="status">{t('sending')}</small></article>}</section>
  <form className="assistant-form" onSubmit={send}>
   {!!policies.length&&<div className="assistant-policy-context"><label className="account-consent"><input type="checkbox" checked={share} disabled={!!pending} onChange={e=>{setShare(e.target.checked);setMessages([]);}}/><span>{t('share')}</span></label>{share&&<><label htmlFor="assistant-policy">{t('policy')}</label><select className="input" id="assistant-policy" value={policyId} disabled={!!pending} onChange={e=>{setPolicyId(e.target.value);setMessages([]);}}><option value="">{t('choose')}</option>{policies.map(policy=><option key={policy.id} value={policy.id}>{policy.number}</option>)}</select><p className="small muted">{t('shareHint')}</p></>}</div>}
   <label className="account-consent"><input type="checkbox" checked={consent} disabled={!!pending} onChange={e=>setConsent(e.target.checked)}/><span>{t('consent')}</span></label>
   <div className="field"><label htmlFor="assistant-question">{t('message')}</label><textarea ref={field} id="assistant-question" name="message" className="input" rows={3} required maxLength={1500} disabled={!configured||!!pending} value={question} placeholder={t('placeholder')} onChange={e=>{setQuestion(e.target.value);setError('');}}/></div>
   {error&&<p className="field-error" role="alert">{error}</p>}
   <div className="assistant-actions"><button className="button" disabled={!configured||!!pending}>{pending&&<LoaderCircle size={18} className="spin" aria-hidden="true"/>}{t('send')}<ArrowRight size={18} aria-hidden="true"/></button>{pending?<button type="button" className="button button-secondary" onClick={stop}>{t('cancel')}</button>:!!messages.length&&<button className="account-text-link" type="button" onClick={()=>{setMessages([]);setError('');}}>{t('clear')}</button>}</div>
  </form><p className="assistant-disclaimer">{t('disclaimer')}</p><Link className="account-text-link" href={`/${locale}/help`}>{t('help')}<ArrowRight size={17} aria-hidden="true"/></Link>
 </div>;
}
