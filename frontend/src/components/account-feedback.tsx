'use client';
import { useTranslations } from 'next-intl';
export function errorCode(error: unknown) {
 return typeof error==='object' && error!==null && 'code' in error ? String(error.code) : 'UNKNOWN';
}
export function ErrorNotice({code}:{code:string}) {
 const t=useTranslations('account'), key=`error_${code}`;
 return <p role="alert" className="account-error-text">{t.has(key)?t(key):t('error')}</p>;
}
