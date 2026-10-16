'use client';

import { useTranslations } from 'next-intl';
import { Check, ChevronDown, CircleHelp, Minus } from 'lucide-react';
import { Money } from '@/components/money';
import type { Coverage } from '@/lib/contracts';
import type { HomepageExample } from './contracts';

function ExampleBenefit({ benefit }: { benefit: Coverage }) {
  const c = useTranslations('common'), policy = useTranslations('policyDesign');
  const applicable = benefit.status === 'covered' || benefit.status === 'conditional';
  const Icon = applicable ? Check : benefit.status === 'unknown' ? CircleHelp : Minus;
  return <div>
    <dt>{c(benefit.key)}<small><Icon size={13} aria-hidden="true" />{c(benefit.status)}</small></dt>
    <dd>
      <strong>{!applicable ? c(benefit.status) : benefit.limitCents === null ? policy('included') : <Money cents={benefit.limitCents} />}</strong>
      {applicable && <>
        <small>{c(benefit.scope)}</small>
        <small>{policy('excess')}: <Money cents={benefit.deductibleCents} /></small>
        {benefit.limitCents === null && <small>{policy('noLimit')}</small>}
        {benefit.condition && <small className="home-policy-condition">{c(benefit.condition)}</small>}
      </>}
    </dd>
  </div>;
}

/** Read-only fictional policy facts; never fetches a customer's policy. */
export function PolicyExample({ plan }: { plan: HomepageExample['plans'][number] }) {
  const t = useTranslations('homepage'), c = useTranslations('common'), p = useTranslations('plans');
  const primary = plan.coverage.filter(benefit => benefit.key === 'medical' || benefit.key === 'baggage');
  const remaining = plan.coverage.filter(benefit => benefit.key !== 'medical' && benefit.key !== 'baggage');
  return <>
    <dl className="home-policy-lines">
      <div><dt>{t('insurer')}</dt><dd>{plan.provider}</dd></div>
      {primary.map(benefit => <ExampleBenefit key={benefit.key} benefit={benefit} />)}
    </dl>
    <details className="home-policy-details">
      <summary>{t('fullCover')}<ChevronDown size={16} aria-hidden="true" /></summary>
      <dl className="home-policy-lines">{remaining.map(benefit => <ExampleBenefit key={benefit.key} benefit={benefit} />)}</dl>
      <h4>{p('exclusions')}</h4>
      <ul className="home-cover-exclusions">{plan.exclusions.map(key => <li key={key}>{c(key)}</li>)}</ul>
    </details>
  </>;
}
