'use client';
import { Money } from '@/components/money';
import { CurrencySettlementNote } from '@/components/currency-provider';

import { useId } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { CountryFlag } from '@/components/country-flag';
import { countryName } from '@/lib/countries';
import type { Coverage } from '@/lib/contracts';
import { ExampleDates } from './example-dates';
import type { HomepageExample } from './contracts';

type Row = 'medicalLimit' | 'cancellation' | 'baggage' | 'delay' | 'assistance';

function CoverValue({ benefit, row, detailed, showScope }: { benefit?: Coverage; row: Row; detailed: boolean; showScope: boolean }) {
  const c = useTranslations('common'), p = useTranslations('plans'), policy = useTranslations('policyDesign');
  if (!benefit) return <span className="home-cover-unavailable">{c('unknown')}</span>;
  if (benefit.status === 'excluded' || benefit.status === 'unknown') return <span className="home-cover-unavailable">{c(benefit.status)}</span>;
  return <>
    <strong className="home-cover-limit">{benefit.limitCents === null ? policy('included') : <Money cents={benefit.limitCents} />}</strong>
    {showScope && <small>{c(benefit.scope)}</small>}
    {benefit.limitCents === null && <small>{policy('noLimit')}</small>}
    {benefit.status === 'conditional' && <small>{benefit.condition ? c(benefit.condition) : c('conditional')}</small>}
    {(detailed || row === 'baggage' || row === 'medicalLimit' || row === 'cancellation') && <small>{p('deductible')}: <Money cents={benefit.deductibleCents} /></small>}
  </>;
}

/** Read-only fictional cover; no quote identifiers, purchase actions or customer records. */
export function ComparisonExample({ example }: { example: HomepageExample }) {
  const t = useTranslations('homepage'), c = useTranslations('common'), p = useTranslations('plans');
  const locale = useLocale();
  const id = useId();
  const params = useSearchParams();
  const expanded = params.get('cover') === 'full';
  const sharedExclusions = example.plans[0].exclusions.filter(key => example.plans.every(plan => plan.exclusions.includes(key)));
  function rows(keys: readonly Row[]) {
    return keys.map(row => {
      const benefits = example.plans.map(plan => plan.coverage.find(item => item.key === (row === 'medicalLimit' ? 'medical' : row)));
      const sharedScope = benefits[0]?.scope && benefits.every(benefit => benefit?.scope === benefits[0]?.scope) ? benefits[0].scope : null;
      return <tr key={row} role="row">
        <th role="rowheader" scope="row" id={`${id}-${row}`}><span className="home-benefit-label">{row === 'medicalLimit' ? c('medical') : row === 'cancellation' ? t(row) : c(row)}</span>{sharedScope && <small>{c(sharedScope)}</small>}</th>
        {example.plans.map((plan, index) => <td role="cell" key={plan.plan} headers={`${id}-${plan.plan} ${id}-${row}`}>
          <CoverValue row={row} detailed={expanded} showScope={!sharedScope} benefit={benefits[index]} />
        </td>)}
      </tr>;
    });
  }
  return <div className="home-comparison-example">
    <div className="home-example-meta"><span className="home-example-route"><span><CountryFlag code={example.residenceCountry} size="small" />{countryName(example.residenceCountry, locale)}</span><span aria-hidden="true">→</span><span><CountryFlag code={example.destinationCountry} size="small" />{countryName(example.destinationCountry, locale)}</span></span><span className="home-example-label">{t('example')}</span></div>
    <div className="home-example-context"><p>{t('trip', { days: example.days, count: example.travelerCount, age: example.travelerAge })}</p><ExampleDates startDate={example.startDate} endDate={example.endDate} /></div>
    <table className="home-comparison-table" role="table">
      <caption className="sr-only">{t('compareTitle')} {t('example')}</caption>
      <thead role="rowgroup"><tr role="row"><th scope="col" className="home-example-price-note">{t('price')}</th>{example.plans.map(plan => <th className="home-plan-heading" key={plan.plan} role="columnheader" scope="col" id={`${id}-${plan.plan}`}>{c(plan.plan)}<small>{plan.provider}</small><strong><Money cents={plan.totalCents} displayCurrency /></strong></th>)}</tr></thead>
      <tbody role="rowgroup">{rows(['medicalLimit', 'baggage', 'cancellation'])}</tbody>
      <tbody role="rowgroup" id={`${id}-more-cover`} hidden={!expanded}>
        {rows(['delay', 'assistance'])}
        <tr role="row"><th role="rowheader" scope="row" id={`${id}-exclusions`}>{p('exclusions')}</th>{example.plans.map(plan => <td key={plan.plan} role="cell" headers={`${id}-${plan.plan} ${id}-exclusions`}><ul className="home-cover-exclusions">{plan.exclusions.map(key => <li key={key}>{c(key)}</li>)}</ul></td>)}</tr>
      </tbody>
    </table>
    <div className="home-example-controls"><button type="button" className="home-cover-toggle" aria-expanded={expanded} aria-controls={`${id}-more-cover`} onClick={() => {
      const url = new URL(window.location.href);
      url.hash = 'experience';
      if (expanded) url.searchParams.delete('cover'); else url.searchParams.set('cover', 'full');
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }}>{t(expanded ? 'lessCover' : 'moreCover')}<ChevronDown size={16} aria-hidden="true" /></button>{sharedExclusions.length > 0 && <p className="home-example-exclusions"><strong>{p('exclusions')}: </strong>{sharedExclusions.map(key => c(key)).join('; ')}.</p>}</div>
    <p className="home-example-note">{t('exampleNote')} {t('baggageNote')}</p>
    <CurrencySettlementNote />
  </div>;
}
