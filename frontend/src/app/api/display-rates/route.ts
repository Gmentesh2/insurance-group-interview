import { getDisplayRate } from '@/lib/server/display-rates';

/** Public reference data only; no customer/session input is read or forwarded. */
export async function GET() {
  try {
    return Response.json(await getDisplayRate(), { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=3600' } });
  } catch {
    return Response.json({ code: 'DISPLAY_RATE_UNAVAILABLE' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
