'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import type { AuthSession } from '@/lib/contracts';
import { startGuestCheckout } from '@/lib/guest-session';

export function GuestCheckout({ onGuest, onSignIn }: { onGuest: (session: AuthSession) => void; onSignIn: () => void }) {
  const t = useTranslations('guest');
  const [busy, setBusy] = useState(false), [failed, setFailed] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  async function start() {
    if (request.current) return;
    const controller = new AbortController(); request.current = controller;
    setBusy(true); setFailed(false);
    try {
      const session = await startGuestCheckout();
      if (!controller.signal.aborted) onGuest(session);
    } catch { if (!controller.signal.aborted) setFailed(true); }
    finally { if (!controller.signal.aborted) { request.current = null; setBusy(false); } }
  }
  return <section className="account-narrow panel checkout-standalone guest-checkout">
    <h1>{t('title')}</h1><p className="account-lead">{t('hint')}</p>
    {failed && <p className="claim-field-error" role="alert">{t('failed')}</p>}
    <div className="claim-flow-actions"><button className="button" disabled={busy} onClick={() => void start()}>{busy ? <LoaderCircle size={18} className="spin" /> : null}{t('continue')}<ArrowRight size={18} /></button><button className="button button-secondary" disabled={busy} onClick={onSignIn}>{t('signIn')}</button></div>
  </section>;
}
