import { isCalendarDate } from './date-input';

export const MAX_TRIP_DAYS = 366;
const dayMs = 86_400_000;

/** ISO dates are UTC calendar days; both departure and return count. */
export function tripDurationDays(start: string, end: string): number | null {
  if (!isCalendarDate(start) || !isCalendarDate(end) || end < start) return null;
  return (Date.parse(end) - Date.parse(start)) / dayMs + 1;
}

export function latestReturnDate(start: string): string | undefined {
  if (!isCalendarDate(start)) return undefined;
  const end = new Date(Date.parse(start) + (MAX_TRIP_DAYS - 1) * dayMs);
  return end.getUTCFullYear() > 9999 ? '9999-12-31' : end.toISOString().slice(0, 10);
}
