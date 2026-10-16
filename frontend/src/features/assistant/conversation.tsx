'use client';

import Link from 'next/link';
import { useEffect, useId, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { FormField } from '@/components/form-field';
import { useAssistant } from './use-assistant';

const safeHref = (href: string) => /^\/(en|de|ru)\/(help(?:#[a-z-]+)?|account\/policies\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?:#[a-z-]+)?)$/.test(href);

export function AssistantConversation({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('assistant');
  const locale = useLocale();
  const id = useId();
  const chat = useAssistant({ publicOnly: compact });
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = log.current;
    const latest = container?.lastElementChild;
    if (container && latest) container.scrollTop += latest.getBoundingClientRect().top - container.getBoundingClientRect().top;
  }, [chat.messages, chat.pending]);

  return <div className={compact ? 'assistant-content assistant-compact' : 'assistant-content'}>
    {!compact && <p className="assistant-privacy">{t('privacy')}</p>}
    {chat.checking && <p className="assistant-loading" role="status"><LoaderCircle size={18} className="spin" aria-hidden="true" />{t('checking')}</p>}
    {(chat.configured === false || chat.availabilityFailed) && <div className="account-notice" role="status"><p>{t(chat.availabilityFailed ? 'failed' : 'unavailable')}</p><button type="button" className="account-text-link" disabled={chat.checking} onClick={() => void chat.availability()}>{t('retry')}</button></div>}
    <div ref={log} className="assistant-conversation" role="log" aria-label={t('title')} aria-live="polite" aria-busy={!!chat.pending} tabIndex={0}>
      {!chat.messages.length && !chat.pending && <div className="assistant-empty"><p>{t('empty')}</p><div className="assistant-suggestions">{(compact ? (['suggestLuggage', 'suggestExcess'] as const) : (['suggestLuggage', 'suggestExcess', 'suggestClaim'] as const)).map(key => <button type="button" key={key} onClick={() => chat.chooseQuestion(t(key))} disabled={!chat.configured}>{t(key)}</button>)}</div></div>}
      {chat.messages.map((message, index) => <article key={index} className={`assistant-message assistant-${message.role}`}><strong>{t(message.role === 'user' ? 'you' : 'assistant')}</strong><p>{message.text}</p>{message.sources?.some(source => safeHref(source.href)) && <nav aria-label={t('sources')}>{message.sources.filter(source => safeHref(source.href)).map(source => <Link key={source.href} href={source.href}>{source.label}<ArrowRight size={15} aria-hidden="true" /></Link>)}</nav>}</article>)}
      {chat.pending && <article className="assistant-message assistant-user"><strong>{t('you')}</strong><p>{chat.pending}</p><small role="status">{t('sending')}</small></article>}
    </div>
    <form className="assistant-form" onSubmit={chat.send}>
      {!!chat.policies.length && <details className="assistant-policy-context"><summary>{t('context')}</summary><label className="account-consent"><input type="checkbox" checked={chat.share} disabled={!!chat.pending} onChange={event => chat.changeShare(event.target.checked)} /><span>{t('share')}</span></label>{chat.share && <><FormField id={`${id}-policy`} label={t('policy')} required>{control => <select {...control} className="input" value={chat.policyId} disabled={!!chat.pending} onChange={event => chat.changePolicy(event.target.value)}><option value="">{t('choose')}</option>{chat.policies.map(policy => <option key={policy.id} value={policy.id}>{policy.number}</option>)}</select>}</FormField><p className="small muted">{t('shareHint')}</p></>}</details>}
      {!compact && <label className="account-consent"><input type="checkbox" required checked={chat.consent} disabled={!!chat.pending} onChange={event => chat.setConsent(event.target.checked)} /><span>{t('consent')}</span></label>}
      <FormField id={`${id}-question`} label={t('message')} required>
        {control => <textarea {...control} ref={chat.field} name="message" className="input" rows={compact ? 2 : 3} maxLength={1500} disabled={!chat.configured || !!chat.pending} value={chat.question} placeholder={t(compact ? 'compactPlaceholder' : 'placeholder')} onChange={event => chat.editQuestion(event.target.value)} />}
      </FormField>
      {chat.error && <p className="field-error" role="alert">{chat.error}</p>}
      {compact && <p className="assistant-send-disclosure" id={`${id}-disclosure`}>{t('compactPrivacy')}</p>}
      <div className="assistant-actions"><button className="button" aria-describedby={compact ? `${id}-disclosure` : undefined} disabled={!chat.configured || !!chat.pending}>{chat.pending && <LoaderCircle size={18} className="spin" aria-hidden="true" />}{t(compact ? 'sendPublic' : 'send')}<ArrowRight size={18} aria-hidden="true" /></button>{chat.pending ? <button type="button" className="button button-secondary" onClick={chat.stop}>{t('cancel')}</button> : !!chat.messages.length && <button className="account-text-link" type="button" onClick={chat.clear}>{t('clear')}</button>}</div>
    </form>
    <p className="assistant-disclaimer">{t(compact ? 'compactDisclaimer' : 'disclaimer')}</p>
    <Link className="account-text-link" href={`/${locale}/${compact ? 'assistant' : 'help'}`}>{t(compact ? 'expand' : 'help')}<ArrowRight size={17} aria-hidden="true" /></Link>
  </div>;
}
