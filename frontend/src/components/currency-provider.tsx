'use client';

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { displayRateSchema, isCurrentDisplayRate, resolveDisplayCurrency, type DisplayCurrency, type DisplayRate } from '@/lib/display-currency';

const preferenceKey = 'insurance-group-display-currency';
const preferenceEvent = 'display-currency-change';
let memoryPreference: DisplayCurrency = 'EUR';
let storageAvailable = true;
function readPreference(): DisplayCurrency {
  if (!storageAvailable) return memoryPreference;
  try { return window.localStorage.getItem(preferenceKey) === 'USD' ? 'USD' : 'EUR'; }
  catch { return memoryPreference; }
}
function subscribe(listener: () => void) {
  window.addEventListener(preferenceEvent, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(preferenceEvent, listener);
    window.removeEventListener('storage', listener);
  };
}
const CurrencyContext = createContext<{
  currency: DisplayCurrency;
  requestedCurrency: DisplayCurrency;
  select: (currency: DisplayCurrency) => void;
  rate: DisplayRate | null;
  loading: boolean;
  failed: boolean;
  retry: () => void;
} | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const currency = useSyncExternalStore(subscribe, readPreference, () => 'EUR' as const);
  const [state, setState] = useState<{ rate: DisplayRate | null; loading: boolean; failed: boolean }>({ rate: null, loading: false, failed: false });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (currency !== 'USD') return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    setState(previous => ({ ...previous, loading: true, failed: false }));
    let cancelled = false;
    void fetch('/api/display-rates', { signal: controller.signal, credentials: 'omit' })
      .then(async response => {
        if (!response.ok) throw new Error('RATE_UNAVAILABLE');
        const rate = displayRateSchema.parse(await response.json());
        if (!isCurrentDisplayRate(rate)) throw new Error('STALE_RATE');
        if (!controller.signal.aborted) setState({ rate, loading: false, failed: false });
      })
      .catch(() => {
        if (!cancelled) setState({ rate: null, loading: false, failed: true });
      })
      .finally(() => window.clearTimeout(timeout));
    return () => { cancelled = true; controller.abort(); window.clearTimeout(timeout); };
  }, [currency, attempt]);
  function select(next: DisplayCurrency) {
    if (next === 'USD') setAttempt(value => value + 1);
    memoryPreference = next;
    try { window.localStorage.setItem(preferenceKey, next); storageAvailable = true; }
    catch { storageAvailable = false; }
    window.dispatchEvent(new Event(preferenceEvent));
  }
  return <CurrencyContext value={{ currency: resolveDisplayCurrency(currency, state.rate), requestedCurrency: currency, select, ...state, retry: () => setAttempt(value => value + 1) }}>{children}</CurrencyContext>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('CurrencyProvider is required');
  return context;
}

export function CurrencySettlementNote() {
  const { currency } = useCurrency();
  const t = useTranslations('currency');
  return currency === 'USD' ? <p className="currency-settlement-note">{t('paymentNote')}</p> : null;
}
