import { z } from 'zod';

export type DisplayCurrency = 'EUR' | 'USD';
export const DISPLAY_RATE_MAX_AGE_MS = 7 * 86_400_000;
export const displayRateSchema = z.object({
  base: z.literal('EUR'),
  currency: z.literal('USD'),
  rate: z.number().positive().max(100),
  date: z.iso.date(),
  source: z.literal('ECB'),
});
export type DisplayRate = z.infer<typeof displayRateSchema>;

/** Reference rates are for display only, never order, payment or policy values. */
export function isCurrentDisplayRate(rate: DisplayRate, now = Date.now()) {
  const age = now - Date.parse(`${rate.date}T00:00:00Z`);
  return age >= 0 && age <= DISPLAY_RATE_MAX_AGE_MS;
}

/** A missing or expired reference never makes an EUR amount look like USD. */
export function resolveDisplayCurrency(preference: DisplayCurrency, rate: DisplayRate | null, now = Date.now()): DisplayCurrency {
  return preference === 'USD' && rate && isCurrentDisplayRate(rate, now) ? 'USD' : 'EUR';
}

export function parseEcbDisplayRate(xml: string, now = Date.now()): DisplayRate {
  if (xml.length > 32_768) throw new Error('INVALID_DISPLAY_RATE');
  const date = xml.match(/<Cube\s+time=['"](\d{4}-\d{2}-\d{2})['"]\s*>/)?.[1];
  const value = xml.match(/<Cube\s+currency=['"]USD['"]\s+rate=['"]([\d.]+)['"]\s*\/>/)?.[1];
  const rate = displayRateSchema.parse({ base: 'EUR', currency: 'USD', rate: Number(value), date, source: 'ECB' });
  if (!isCurrentDisplayRate(rate, now)) throw new Error('STALE_DISPLAY_RATE');
  return rate;
}

export function usdEstimate(cents: number, rate: DisplayRate, locale: string, now = Date.now()) {
  if (!Number.isSafeInteger(cents) || cents < 0 || !isCurrentDisplayRate(rate, now)) return null;
  const usdCents = Math.round(cents * rate.rate);
  if (!Number.isSafeInteger(usdCents)) return null;
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol', minimumFractionDigits: usdCents % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 })
    .format(usdCents / 100);
}
