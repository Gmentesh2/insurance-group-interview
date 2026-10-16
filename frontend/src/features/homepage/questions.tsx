'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Plus } from 'lucide-react';
import { TravelQuoteLink } from '@/components/travel-quote-link';

/** Public answers and useful next steps; no account records are loaded here. */
export function HomepageQuestions({ onTravel }: { onTravel: () => void }) {
  const t = useTranslations('homepage');
  const locale = useLocale();
  return <section className="container home-faq-section" id="questions" aria-labelledby="home-faq-title">
    <div className="home-section-copy">
      <h2 id="home-faq-title">{t('faqTitle')}</h2>
      <p>{t('faqIntro')}</p>
      <Link className="landing-inline-link" href={`/${locale}/help`}>
        {t('helpAction')}<ArrowRight size={18} aria-hidden="true" />
      </Link>
    </div>
    <div className="home-faq-list">
      {(['Products', 'Guest', 'Access', 'Luggage', 'Excess', 'Payment'] as const).map(topic => <details key={topic} open={topic === 'Products'}>
        <summary><span>{t(`q${topic}`)}</span><Plus size={18} strokeWidth={1.7} aria-hidden="true" /></summary>
        <div className="home-faq-answer">
          <p>{t(`a${topic}`)}</p>
          {topic === 'Products' && <TravelQuoteLink className="landing-inline-link" onTravel={onTravel}>{t('compareAction')}<ArrowRight size={16} aria-hidden="true" /></TravelQuoteLink>}
          {topic === 'Luggage' && <Link className="landing-inline-link" href="#experience">{t('luggageAction')}<ArrowRight size={16} aria-hidden="true" /></Link>}
          {topic === 'Access' && <Link className="landing-inline-link" href={`/${locale}/account`}>
            {t('policyAction')}<ArrowRight size={16} aria-hidden="true" />
          </Link>}
        </div>
      </details>)}
    </div>
  </section>;
}
