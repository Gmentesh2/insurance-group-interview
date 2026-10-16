'use client';
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole } from 'lucide-react';
import type { AuthSession } from '@/lib/contracts';
import { api, RequestError } from '@/lib/client';
import { authFormDraft, saveAuthFormDraft, clearAuthFormDrafts } from '@/lib/auth-form-draft';
import { contactEmailSchema } from '@/lib/guest-validation';
import { FormField } from './form-field';
import { Input } from './ui';
import { AuthScreen } from './auth-screen';

/** Passwords live only in the mounted form, never browser storage or shared drafts. */
export function PasswordAuthForm({onSuccess,defaultEmail='',linkGuest=false,draftOwner='sign-in'}:{onSuccess:(session:AuthSession)=>void;defaultEmail?:string;linkGuest?:boolean;draftOwner?:string}) {
 const screen=useTranslations('authScreen');
 const t=useTranslations('passwordAuth'),h=useTranslations('homepage'),locale=useLocale(),id=useId();
 const [initial]=useState(()=>authFormDraft(draftOwner,{email:defaultEmail,register:linkGuest}));
 const [register,setRegister]=useState(initial.register),[email,setEmail]=useState(initial.email),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[show,setShow]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[fields,setFields]=useState<Record<string,string>>({});
 const heading=useRef<HTMLHeadingElement>(null);
 const form=useRef<HTMLFormElement>(null),request=useRef<AbortController|null>(null);
 useEffect(()=>()=>request.current?.abort(),[]);
 async function submit(event:FormEvent) {
  event.preventDefault();if(request.current)return;
  const invalid:Record<string,string>={};
  if(register?!contactEmailSchema.safeParse(email).success:!email.trim()||email.trim().length>254)invalid.email=t(register?'invalidEmail':'invalidIdentifier');
  if(!password||password.length>128||(register&&password.length<8))invalid.password=t('invalidPassword');
  if(register&&confirm!==password)invalid.confirm=t('mismatch');
  setFields(invalid);setError('');
  if(Object.keys(invalid).length){requestAnimationFrame(()=>form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());return;}
  const controller=new AbortController();request.current=controller;setBusy(true);const targetEmail=email.trim().toLowerCase();
  try {
   const session=await api<AuthSession>(linkGuest?'/auth/guest-access/credentials':register?'/auth/register':'/auth/login',{method:'POST',body:JSON.stringify({email:targetEmail,password,...(linkGuest?{register}:{})}),signal:controller.signal});
   if(!controller.signal.aborted){clearAuthFormDrafts();setPassword('');setConfirm('');onSuccess(session);}
  }catch(e){
   if(controller.signal.aborted)return;
   try{const session=await api<AuthSession>('/auth/session',{signal:controller.signal});if(session.user&&!session.user.isGuest&&[session.user.email,session.user.username].some(value=>value?.toLowerCase()===targetEmail)){clearAuthFormDrafts();setPassword('');setConfirm('');onSuccess(session);return;}}catch{/* Never resubmit credentials automatically after an uncertain result. */}
   if(!controller.signal.aborted){const code=e instanceof RequestError?e.code:'';setError(t.has(code)?t(code):t('error'));}
  }finally{if(!controller.signal.aborted){request.current=null;setBusy(false);}}
 }
 function updateField(field:string,value:string){if(field==='email')saveAuthFormDraft(draftOwner,{email:value,register});setFields(current=>({...current,[field]:''}));if(field==='email')setEmail(value);else if(field==='password')setPassword(value);else setConfirm(value);}
 function backToSignIn(){saveAuthFormDraft(draftOwner,{email,register:false});setRegister(false);setPassword('');setConfirm('');setFields({});setError('');requestAnimationFrame(()=>heading.current?.focus({preventScroll:true}));}
 return <>
  {!linkGuest&&<div className="auth-card-navigation">{register?<button type="button" className="icon-button" onClick={backToSignIn} aria-label={screen('backSignIn')} disabled={busy}><ArrowLeft size={20} aria-hidden="true"/></button>:<Link className="icon-button" href={`/${locale}#products`} aria-label={h('backToProducts')}><ArrowLeft size={20} aria-hidden="true"/></Link>}</div>}
  {!linkGuest&&<><div className="sign-in-heading"><h1 ref={heading} tabIndex={-1}>{register?t('register'):screen('welcome')}</h1></div><p className="account-lead">{register?t('registerIntro'):screen('intro')}</p></>}
  <form ref={form} className="account-auth-form password-auth-form" onSubmit={submit}>
   {error&&<div className="account-error-text" role="alert">{error}</div>}
   <FormField id={`${id}-email`} label={t(register?'email':'identifier')} required error={fields.email}>
    {control => <Input {...control} name="email" type={register?'email':'text'} autoComplete={register?'email':'username'} autoCapitalize="none" spellCheck={false} maxLength={254} disabled={busy} value={email} onChange={e=>updateField('email',e.target.value)} />}
   </FormField>
   <FormField id={`${id}-password`} label={t('password')} required hint={register?t('rules'):undefined} error={fields.password}>
    {control => <div className="password-field"><Input {...control} name="password" type={show?'text':'password'} autoComplete={register?'new-password':'current-password'} minLength={register?8:1} maxLength={128} disabled={busy} value={password} onChange={e=>updateField('password',e.target.value)} /><button className="icon-button" type="button" aria-label={t(show?'hide':'show')} aria-pressed={show} onClick={()=>setShow(value=>!value)}>{show?<EyeOff size={19} aria-hidden="true"/>:<Eye size={19} aria-hidden="true"/>}</button></div>}
   </FormField>
   {register&&<FormField id={`${id}-confirm`} label={t('confirm')} required error={fields.confirm}>
    {control => <Input {...control} name="confirmPassword" type={show?'text':'password'} autoComplete="new-password" maxLength={128} disabled={busy} value={confirm} onChange={e=>updateField('confirm',e.target.value)} />}
   </FormField>}
   <button className="button account-full" disabled={busy}>{busy&&<LoaderCircle className="spin" size={18} aria-hidden="true"/>}{t(busy?'busy':linkGuest?'saveAction':register?'register':'signIn')}<ArrowRight size={18} aria-hidden="true"/></button>
   <div className="auth-mode-switch">{!linkGuest&&<p>{screen(register?'existingAccount':'newAccount')}</p>}<button className={`${linkGuest?'account-text-link':'button button-secondary'} account-full`} type="button" disabled={busy} onClick={()=>{saveAuthFormDraft(draftOwner,{email,register:!register});setRegister(value=>!value);setPassword('');setConfirm('');setFields({});setError('');requestAnimationFrame(()=>heading.current?.focus({preventScroll:true}));}}>{t(linkGuest?(register?'switchLogin':'switchRegister'):register?'signIn':'register')}</button></div>
   {linkGuest&&<p className="account-security"><LockKeyhole size={14} aria-hidden="true"/>{t('security')}</p>}
  </form>
 </>;
}
export function SignIn({onSuccess,context}:{onSuccess:(session:AuthSession)=>void;context?:ReactNode}) {
 return <AuthScreen context={context}><PasswordAuthForm onSuccess={session=>{onSuccess(session);window.dispatchEvent(new Event('auth-change'));}}/></AuthScreen>;
}
