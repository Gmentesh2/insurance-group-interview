'use client';
import { useTranslations } from 'next-intl';
import type { AuthSession, SessionUser } from '@/lib/contracts';
import { PasswordAuthForm } from './password-auth';
export function GuestSaveAccess({user,defaultEmail='',onSaved}:{user:SessionUser;defaultEmail?:string;onSaved?:(session:AuthSession)=>void}) {
 const t=useTranslations('passwordAuth');
 return <section className="guest-save-access"><h2>{t('saveTitle')}</h2><p>{t('saveHint')}</p><PasswordAuthForm key={user.id} draftOwner={`guest:${user.id}`} linkGuest defaultEmail={defaultEmail} onSuccess={session=>{onSaved?.(session);window.dispatchEvent(new Event('auth-change'));}}/></section>;
}
