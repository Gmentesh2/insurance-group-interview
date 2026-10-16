'use client';

import { useLocale } from 'next-intl';
import type { HomepageExample } from './contracts';

/** Both public previews describe the same fictional cover period. */
export function ExampleDates({ startDate, endDate }: Pick<HomepageExample, 'startDate' | 'endDate'>) {
  const locale = useLocale();
  const date = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  const format = (value: string) => date.format(new Date(`${value}T00:00:00Z`));
  return <p className="home-record-dates"><time dateTime={startDate}>{format(startDate)}</time><span>—</span><time dateTime={endDate}>{format(endDate)}</time></p>;
}
