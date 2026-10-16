import type { AuthSession } from './contracts';
import { api } from './client';

let pending: Promise<AuthSession> | null = null;
/** One bootstrap across locale remounts and tabs; no credentials in browser storage. */
export function startGuestCheckout(): Promise<AuthSession> {
  if (pending) return pending;
  pending = (async () => {
    if (!navigator.locks) throw new Error('Guest checkout needs safe session coordination. Sign in instead.');
    return navigator.locks.request('insurance-group:guest-checkout', { signal: AbortSignal.timeout(30_000) }, async () => {
      const signal = AbortSignal.timeout(30_000);
      const existing = await api<AuthSession>('/auth/session', { signal });
      if (existing.user) return existing;
      try { await api<AuthSession>('/auth/guest', { method: 'POST', body: '{}', signal }); }
      catch {
        // Reconcile a lost reply. Never create a second identity automatically.
      }
      const confirmed = await api<AuthSession>('/auth/session', { signal: AbortSignal.timeout(30_000) });
      if (!confirmed.user) throw new Error('Guest session unavailable');
      return confirmed;
    });
  })().finally(() => { pending = null; });
  return pending;
}
