'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { TravelQuoteLink } from '@/components/travel-quote-link';
import type { HomepageExample } from './contracts';
import { WorkspaceExample } from './examples';
import { ComparisonExample } from './comparison-example';
import { HomepageQuestions } from './questions';

export function HomepageSections({ example, onTravel }: { example: HomepageExample; onTravel: () => void }) {
  const t = useTranslations('homepage');
  return <>
    <section className="container home-compare-section home-compare-layout" id="experience" aria-labelledby="home-compare-title">
      <div className="home-compare-heading"><div className="home-section-copy"><h2 id="home-compare-title" tabIndex={-1}>{t('compareTitle')}</h2><p>{t('compareText')}</p></div><Image className="home-travel-illustration" src="/images/illustrations/travel-cover.webp" alt="" width={960} height={640} sizes="(max-width: 767px) 240px, (max-width: 900px) 320px, 400px" loading="lazy" unoptimized /></div>
      <ComparisonExample example={example} />
      <div className="home-compare-next"><TravelQuoteLink className="button" onTravel={onTravel}>{t('compareAction')}<ArrowRight size={18} aria-hidden="true" /></TravelQuoteLink><p>{t('compareNext')}</p></div>
    </section>
    <section className="home-manage-section" id="manage" aria-labelledby="home-manage-title">
      <WorkspaceExample example={example} />
    </section>
    <HomepageQuestions onTravel={onTravel} />
  </>;
}
