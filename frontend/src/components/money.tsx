'use client';

import { useLocale } from 'next-intl';
import { money } from '@/lib/countries';
import { usdEstimate } from '@/lib/display-currency';
import { useCurrency } from './currency-provider';

/** Shopping prices opt into display currency; contractual amounts remain EUR. */
export function Money({ cents, displayCurrency = false }: { cents: number; displayCurrency?: boolean }) {
  const locale = useLocale();
  const { currency, rate } = useCurrency();
  const converted = displayCurrency && currency === 'USD' && rate ? usdEstimate(cents, rate, locale) : null;
  return <span className="money-display">{converted ?? money(cents, locale)}</span>;
}
