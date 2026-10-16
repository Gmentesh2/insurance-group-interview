'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { api, RequestError } from '@/lib/client';
import type { AuthSession, Policy } from '@/lib/contracts';
import { SESSION_EXPIRED } from '@/lib/session-recovery';

export type AssistantMessage = { role: 'user' | 'model'; text: string; sources?: { label: string; href: string }[] };

/** Page and widget share bounded, in-memory conversations; no automatic sends or retries. */
export function useAssistant({ publicOnly = false }: { publicOnly?: boolean } = {}) {
  const t = useTranslations('assistant');
  const locale = useLocale();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [availabilityFailed, setAvailabilityFailed] = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [pending, setPending] = useState('');
  const [consent, setConsent] = useState(false);
  const [share, setShare] = useState(false);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [policyId, setPolicyId] = useState('');
  const [error, setError] = useState('');
  const field = useRef<HTMLTextAreaElement>(null);
  const request = useRef<AbortController | null>(null);
  const statusRequest = useRef<AbortController | null>(null);

  const readAvailability = useCallback((controller: AbortController) => {
    void api<{ configured: boolean }>('/assistant/status', { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setConfigured(result.configured); })
      .catch(() => { if (!controller.signal.aborted) setAvailabilityFailed(true); })
      .finally(() => { if (!controller.signal.aborted) setChecking(false); });
  }, []);

  function availability() {
    statusRequest.current?.abort();
    const controller = new AbortController();
    statusRequest.current = controller;
    setChecking(true);
    setConfigured(null);
    setAvailabilityFailed(false);
    void readAvailability(controller);
  }

  useEffect(() => {
    const availabilityRequest = new AbortController();
    statusRequest.current = availabilityRequest;
    void readAvailability(availabilityRequest);
    let ownedRequest = new AbortController();
    async function loadOwned() {
      if (publicOnly) return;
      const controller = ownedRequest;
      try {
        const session = await api<AuthSession>('/auth/session', { signal: controller.signal });
        if (session.user && !controller.signal.aborted) {
          const data = await api<{ policies: Policy[] }>('/policies', { signal: controller.signal });
          if (!controller.signal.aborted) setPolicies(data.policies);
        }
      } catch { /* Public help does not require an account or policy. */ }
    }
    function clearIdentity() {
      ownedRequest.abort();
      request.current?.abort();
      request.current = null;
      setPending('');
      setQuestion('');
      setMessages([]);
      setPolicies([]);
      setShare(false);
      setPolicyId('');
      setConsent(false);
      setError('');
    }
    const changed = () => { clearIdentity(); ownedRequest = new AbortController(); void loadOwned(); };
    void loadOwned();
    window.addEventListener('auth-change', changed);
    window.addEventListener(SESSION_EXPIRED, clearIdentity);
    return () => {
      ownedRequest.abort();
      request.current?.abort();
      statusRequest.current?.abort();
      window.removeEventListener('auth-change', changed);
      window.removeEventListener(SESSION_EXPIRED, clearIdentity);
    };
  }, [readAvailability, locale, publicOnly]);

  async function send(event: FormEvent) {
    event.preventDefault();
    if (request.current || !configured || !question.trim()) return;
    if (!publicOnly && !consent) { setError(t('consentRequired')); return; }
    if (!publicOnly && share && !policyId) { setError(t('selectRequired')); return; }
    const controller = new AbortController();
    request.current = controller;
    const text = question.trim();
    setPending(text);
    setError('');
    try {
      const result = await api<{ reply: string; sources: { label: string; href: string }[] }>('/assistant/chat', {
        method: 'POST',
        body: JSON.stringify({ locale, message: text, history: messages.slice(-8).map(({ role, text }) => ({ role, text: text.slice(0, 1500) })), ...(!publicOnly && share ? { policyId, sharePolicy: true } : {}) }),
        signal: controller.signal,
        timeoutMs: 35000,
      });
      if (!controller.signal.aborted && request.current === controller) {
        setMessages(current => [...current, { role: 'user' as const, text }, { role: 'model' as const, text: result.reply, sources: result.sources }].slice(-20));
        setQuestion('');
      }
    } catch (cause) {
      if (!controller.signal.aborted && request.current === controller) {
        setError(t(cause instanceof RequestError && cause.code === 'RATE_LIMITED' ? 'rateLimited' : cause instanceof RequestError && cause.code === 'ASSISTANT_TIMEOUT' ? 'timeout' : 'failed'));
      }
    } finally {
      if (!controller.signal.aborted && request.current === controller) { request.current = null; setPending(''); }
    }
  }
  function stop() { request.current?.abort(); request.current = null; setPending(''); }
  function clear() { setMessages([]); setError(''); }
  function editQuestion(value: string) { setQuestion(value); setError(''); }
  function chooseQuestion(value: string) { editQuestion(value); field.current?.focus(); }
  function changeShare(value: boolean) { setShare(value); clear(); }
  function changePolicy(value: string) { setPolicyId(value); clear(); }

  return { configured, checking, availabilityFailed, availability, messages, question, editQuestion, chooseQuestion, pending, consent, setConsent, share, changeShare, policies, policyId, changePolicy, error, field, send, stop, clear };
}
