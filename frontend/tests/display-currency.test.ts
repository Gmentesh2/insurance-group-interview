import { describe, expect, it, vi, afterEach } from 'vitest';
import { displayRateSchema, isCurrentDisplayRate, parseEcbDisplayRate, resolveDisplayCurrency, usdEstimate } from '../src/lib/display-currency';

const now = Date.parse('2026-10-15T12:00:00Z');
const xml = (date = '2026-10-15', value = '1.1208') => `<Envelope><Cube><Cube time='${date}'><Cube currency='USD' rate='${value}'/></Cube></Cube></Envelope>`;

describe('reference-only currency conversion', () => {
  it('shows USD only with a current rate, otherwise keeps the effective selector and prices in EUR', () => {
    const rate = parseEcbDisplayRate(xml(), now);
    expect(resolveDisplayCurrency('USD', null, now)).toBe('EUR');
    expect(resolveDisplayCurrency('USD', rate, now)).toBe('USD');
    expect(resolveDisplayCurrency('EUR', rate, now)).toBe('EUR');
    expect(resolveDisplayCurrency('USD', rate, now + 8 * 86_400_000)).toBe('EUR');
  });
  it('validates a dated ECB USD rate and preserves the original EUR cents', () => {
    const rate = parseEcbDisplayRate(xml(), now), originalCents = 1999;
    expect(rate).toEqual({ base: 'EUR', currency: 'USD', rate: 1.1208, date: '2026-10-15', source: 'ECB' });
    expect(usdEstimate(originalCents, rate, 'en', now)).toMatch(/\$22\.40/);
    expect(usdEstimate(0, rate, 'de', now)).toMatch(/0\s+\$/);
  });
  it('rejects missing, malformed, impossible, stale and future rate data without inventing a fallback', () => {
    for (const input of ['', xml('2026-02-30'), xml('2026-10-01'), xml('2026-10-16'), xml('2026-10-15', '0'), xml('2026-10-15', 'NaN')]) {
      expect(() => parseEcbDisplayRate(input, now)).toThrow();
    }
    expect(displayRateSchema.safeParse({ base: 'USD', currency: 'EUR', rate: 1 }).success).toBe(false);
  });
  it('tolerates a weekend/holiday gap but stops using an expired rate or invalid amount', () => {
    const rate = parseEcbDisplayRate(xml('2026-10-09'), now);
    expect(isCurrentDisplayRate(rate, now)).toBe(true);
    expect(usdEstimate(100, rate, 'ru', now)).toContain('$');
    expect(usdEstimate(100, rate, 'en', now + 2 * 86_400_000)).toBeNull();
    expect(usdEstimate(-1, rate, 'en', now)).toBeNull();
    expect(usdEstimate(10.5, rate, 'en', now)).toBeNull();
  });
});

vi.mock('../src/lib/server/display-rates', () => ({ getDisplayRate: vi.fn() }));
import { getDisplayRate } from '../src/lib/server/display-rates';
import { GET } from '../src/app/api/display-rates/route';
afterEach(() => vi.resetAllMocks());
it('returns public reference data, or an uncached failure rather than a fabricated conversion', async () => {
  vi.mocked(getDisplayRate).mockResolvedValue(parseEcbDisplayRate(xml(), now));
  const success = await GET();
  expect(success.status).toBe(200);
  expect(await success.json()).toHaveProperty('currency', 'USD');
  expect(success.headers.get('Cache-Control')).toContain('s-maxage=3600');
  vi.mocked(getDisplayRate).mockRejectedValue(new Error('upstream timeout'));
  const failure = await GET();
  expect(failure.status).toBe(503);
  expect(failure.headers.get('Cache-Control')).toBe('no-store');
  expect(await failure.json()).toEqual({ code: 'DISPLAY_RATE_UNAVAILABLE' });
});
