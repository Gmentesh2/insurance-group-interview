'use client';
import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole } from 'lucide-react';
import type { AuthSession } from '@/lib/contracts';
import { api, RequestError } from '@/lib/client';
import { authFormDraft, saveAuthFormDraft, clearAuthFormDrafts } from '@/lib/auth-form-draft';
import { contactEmailSchema } from '@/lib/guest-validation';
import { FieldRequirement } from './flow-progress';
import { InsuranceIllustration } from './insurance-illustration';

/** Passwords live only in the mounted form, never browser storage or shared drafts. */
export function PasswordAuthForm({onSuccess,defaultEmail='',linkGuest=false,draftOwner='sign-in'}:{onSuccess:(session:AuthSession)=>void;defaultEmail?:string;linkGuest?:boolean;draftOwner?:string}) {
 const t=useTranslations('passwordAuth'),h=useTranslations('homepage'),locale=useLocale(),id=useId();
 const [initial]=useState(()=>authFormDraft(draftOwner,{email:defaultEmail,register:linkGuest}));
 const [register,setRegister]=useState(initial.register),[email,setEmail]=useState(initial.email),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[show,setShow]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[fields,setFields]=useState<Record<string,string>>({});
 const form=useRef<HTMLFormElement>(null),request=useRef<AbortController|null>(null);
 useEffect(()=>()=>request.current?.abort(),[]);
 async function submit(event:FormEvent) {
  event.preventDefault();if(request.current)return;
  const invalid:Record<string,string>={};
  if(!contactEmailSchema.safeParse(email).success)invalid.email=t('invalidEmail');
  if(!password||password.length>128||(register&&(password.length<12||!/[A-Z]/.test(password)||!/[a-z]/.test(password)||!/\d/.test(password)||!/[^A-Za-z0-9]/.test(password))))invalid.password=t('invalidPassword');
  if(register&&confirm!==password)invalid.confirm=t('mismatch');
  setFields(invalid);setError('');
  if(Object.keys(invalid).length){requestAnimationFrame(()=>form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());return;}
  const controller=new AbortController();request.current=controller;setBusy(true);const targetEmail=email.trim().toLowerCase();
  try {
   const session=await api<AuthSession>(linkGuest?'/auth/guest-access/credentials':register?'/auth/register':'/auth/login',{method:'POST',body:JSON.stringify({email:targetEmail,password,...(linkGuest?{register}:{})}),signal:controller.signal});
   if(!controller.signal.aborted){clearAuthFormDrafts();setPassword('');setConfirm('');onSuccess(session);}
  }catch(e){
   if(controller.signal.aborted)return;
   try{const session=await api<AuthSession>('/auth/session',{signal:controller.signal});if(session.user&&!session.user.isGuest&&session.user.email.toLowerCase()===targetEmail){clearAuthFormDrafts();setPassword('');setConfirm('');onSuccess(session);return;}}catch{/* Never resubmit credentials automatically after an uncertain result. */}
   if(!controller.signal.aborted){const code=e instanceof RequestError?e.code:'';setError(t.has(code)?t(code):t('error'));}
  }finally{if(!controller.signal.aborted){request.current=null;setBusy(false);}}
 }
 function updateField(field:string,value:string){if(field==='email')saveAuthFormDraft(draftOwner,{email:value,register});setFields(current=>({...current,[field]:''}));if(field==='email')setEmail(value);else if(field==='password')setPassword(value);else setConfirm(value);}
 function backToSignIn(){saveAuthFormDraft(draftOwner,{email,register:false});setRegister(false);setPassword('');setConfirm('');setFields({});setError('');}
 return <>
  {!linkGuest&&<div className="auth-card-navigation">{register?<button type="button" className="icon-button" onClick={backToSignIn} aria-label={t('signIn')} disabled={busy}><ArrowLeft size={20} aria-hidden="true"/></button>:<Link className="icon-button" href={`/${locale}#products`} aria-label={h('backToProducts')}><ArrowLeft size={20} aria-hidden="true"/></Link>}</div>}
  {!linkGuest&&<><div className="sign-in-art"><InsuranceIllustration name="cyber"/></div><div className="sign-in-heading"><h1>{t(register?'register':'signIn')}</h1></div><p className="account-lead">{t(register?'registerIntro':'intro')}</p></>}
  <form ref={form} className="account-auth-form password-auth-form" onSubmit={submit}>
   {error&&<div className="account-error-text" role="alert">{error}</div>}
   <div className="field"><label htmlFor={`${id}-email`}>{t('email')}<FieldRequirement/></label><input className="input" id={`${id}-email`} name="email" type="email" autoComplete="email" spellCheck={false} maxLength={254} required disabled={busy} value={email} onChange={e=>updateField('email',e.target.value)} aria-invalid={!!fields.email} aria-describedby={fields.email?`${id}-email-error`:undefined}/>{fields.email&&<p className="field-error" id={`${id}-email-error`}>{fields.email}</p>}</div>
   <div className="field"><label htmlFor={`${id}-password`}>{t('password')}<FieldRequirement/></label><div className="password-field"><input className="input" id={`${id}-password`} name="password" type={show?'text':'password'} autoComplete={register?'new-password':'current-password'} minLength={register?12:1} maxLength={128} pattern={register?"(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{12,128}":undefined} title={register?t('rules'):undefined} required disabled={busy} value={password} onChange={e=>updateField('password',e.target.value)} aria-invalid={!!fields.password} aria-describedby={`${id}-password-hint${fields.password?` ${id}-password-error`:''}`}/><button className="icon-button" type="button" aria-label={t(show?'hide':'show')} aria-pressed={show} onClick={()=>setShow(value=>!value)}>{show?<EyeOff size={19} aria-hidden="true"/>:<Eye size={19} aria-hidden="true"/>}</button></div>{register?<small className="muted" id={`${id}-password-hint`}>{t('rules')}</small>:<span className="sr-only" id={`${id}-password-hint`}>{t('password')}</span>}{fields.password&&<p className="field-error" id={`${id}-password-error`}>{fields.password}</p>}</div>
   {register&&<div className="field"><label htmlFor={`${id}-confirm`}>{t('confirm')}<FieldRequirement/></label><input className="input" id={`${id}-confirm`} name="confirmPassword" type={show?'text':'password'} autoComplete="new-password" required maxLength={128} disabled={busy} value={confirm} onChange={e=>updateField('confirm',e.target.value)} aria-invalid={!!fields.confirm} aria-describedby={fields.confirm?`${id}-confirm-error`:undefined}/>{fields.confirm&&<p className="field-error" id={`${id}-confirm-error`}>{fields.confirm}</p>}</div>}
   <button className="button account-full" disabled={busy}>{busy&&<LoaderCircle className="spin" size={18} aria-hidden="true"/>}{t(busy?'busy':linkGuest?'saveAction':register?'register':'signIn')}<ArrowRight size={18} aria-hidden="true"/></button>
   <button className="account-text-link account-full" type="button" disabled={busy} onClick={()=>{saveAuthFormDraft(draftOwner,{email,register:!register});setRegister(value=>!value);setPassword('');setConfirm('');setFields({});setError('');}}>{t(register?'switchLogin':'switchRegister')}</button>
   <p className="account-security"><LockKeyhole size={14} aria-hidden="true"/>{t('security')}</p>
  </form>
 </>;
}
export function SignIn({onSuccess}:{onSuccess:(session:AuthSession)=>void}) {
 return <div className="sign-in-layout"><section className="sign-in-main"><PasswordAuthForm onSuccess={session=>{onSuccess(session);window.dispatchEvent(new Event('auth-change'));}}/></section></div>;
}
