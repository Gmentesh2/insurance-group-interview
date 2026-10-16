'use client';
import { Money } from '@/components/money';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Tabs } from '@base-ui/react/tabs';
import { ArrowRight, Check, FileText, LockKeyhole } from 'lucide-react';
import { DocumentLanguage } from '@/components/document-language-select';
import { ProductIcon } from '@/components/product-icon';
import { CountryFlag } from '@/components/country-flag';
import { countryName } from '@/lib/countries';
import { ExampleDates } from './example-dates';
import { PolicyExample } from './policy-example';
import type { HomepageExample } from './contracts';

export function WorkspaceExample({ example }: { example: HomepageExample }) {
  const t = useTranslations('homepage'), c = useTranslations('common');
  const locale = useLocale();
  const plan = example.plans[1];
  const params = useSearchParams();
  const documentLocale = params.get('docLang');
  const documentLanguage = documentLocale === 'en' || documentLocale === 'de' || documentLocale === 'ru'
    ? documentLocale : locale === 'de' || locale === 'ru' ? locale : 'en';
  const requested = params.get('view');
  const view = requested === 'documents' || requested === 'claims' ? requested : 'policy';
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 901px)');
    const sync = () => setWide(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);
  const views = [
    { key: 'policy', icon: 'cover' },
    { key: 'documents', icon: 'documents' },
    { key: 'claims', icon: 'claims' },
  ] as const;
  return <Tabs.Root value={view} onValueChange={next => {
    if (next !== 'policy' && next !== 'documents' && next !== 'claims') return;
    const url = new URL(window.location.href);
    url.hash = 'manage';
    if (next === 'policy') url.searchParams.delete('view'); else url.searchParams.set('view', next);
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }} orientation={wide ? 'vertical' : 'horizontal'} className="container home-manage-layout">
    <div className="home-workspace-intro">
      <div className="home-section-copy"><h2 id="home-manage-title" tabIndex={-1}>{t('manageTitle')}</h2><p>{t('manageText')}</p></div>
      <Tabs.List className="home-workspace-tabs" aria-label={t('views')}>
        {views.map(({ key, icon }) => <Tabs.Tab key={key} value={key} aria-label={t(key)}>
          <ProductIcon name={icon} size={24} /><span><strong>{t(key)}</strong><small>{t(`${key}Hint`)}</small></span><ArrowRight size={18} className="home-workspace-tab-arrow" aria-hidden="true" />
        </Tabs.Tab>)}
      </Tabs.List>
    </div>
    <div className="home-workspace-example">
      <header className="home-workspace-context">
        <div className="home-example-context"><span className="home-example-label">{t('example')}</span><span className="home-record-destination"><CountryFlag code={example.destinationCountry} size="small" />{countryName(example.destinationCountry, locale)}<span aria-hidden="true">·</span>{c(plan.plan)}</span></div>
        <ExampleDates startDate={example.startDate} endDate={example.endDate} />
      </header>
    <Tabs.Panel keepMounted value="policy" className="home-workspace-panel">
      <div className="home-record-heading"><h3>{t('policyTitle')}</h3></div>
      <PolicyExample plan={plan} />
      <Link className="home-record-action" href={`/${locale}/account`}>{t('policyAction')}<ArrowRight size={18} aria-hidden="true" /></Link>
    </Tabs.Panel>
    <Tabs.Panel keepMounted value="documents" className="home-workspace-panel">
      <div className="home-record-heading"><h3>{t('documents')}</h3></div>
      <div className="home-document-record"><span className="home-document-file"><FileText size={28} aria-hidden="true" /><small>{t('format')}</small></span><div><h4>{t('certificate')}</h4><p className="home-document-filename" translate="no">travel-certificate-{documentLanguage}.pdf</p></div><span className="home-ready"><Check size={14} aria-hidden="true" />{t('ready')}</span></div>
      <div className="home-document-controls">
        <DocumentLanguage value={documentLanguage} onChange={language => {
          const url = new URL(window.location.href);
          url.searchParams.set('docLang', language);
          url.hash = 'manage';
          window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
        }} />
        <span className="home-document-access"><LockKeyhole size={15} aria-hidden="true" />{t('private')}</span>
      </div>
      <p className="home-document-text">{t('documentText')}</p>
      <Link className="home-record-action" href={`/${locale}/account/documents`}>{t('documentsAction')}<ArrowRight size={18} aria-hidden="true" /></Link>
    </Tabs.Panel>
    <Tabs.Panel keepMounted value="claims" className="home-workspace-panel">
      <div className="home-record-heading"><h3>{t('claimTitle')}</h3></div>
      <div className="home-claim-amount"><span>{t('requested')}</span><strong><Money cents={12000} /></strong></div>
      <p className="home-example-note">{t('amountNote')}</p>
      <ol className="home-claim-activity" aria-label={t('activity')}><li><Check size={16} aria-hidden="true" /><div><strong>{t('submitted')}</strong><p>{t('claimEvent1')}</p></div></li><li><span className="home-activity-dot" aria-hidden="true" /><div><strong>{t('inReview')}</strong><p>{t('claimEvent2')}</p></div></li></ol>
      <p className="home-claim-next">{t('claimNext')}</p>
      <Link className="home-record-action" href={`/${locale}/account/claims`}>{t('claimsAction')}<ArrowRight size={18} aria-hidden="true" /></Link>
    </Tabs.Panel>
    <p className="home-example-account-note">{t('exampleAccount')}</p>
    </div>
  </Tabs.Root>;
}
