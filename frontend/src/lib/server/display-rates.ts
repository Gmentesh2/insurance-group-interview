import 'server-only';
import { parseEcbDisplayRate } from '@/lib/display-currency';

export async function getDisplayRate() {
  const response = await fetch('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml', {
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(5000),
    redirect: 'error',
  });
  if (!response.ok) throw new Error('DISPLAY_RATE_UNAVAILABLE');
  return parseEcbDisplayRate(await response.text());
}
