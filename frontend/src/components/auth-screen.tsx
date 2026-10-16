'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import type { Locale } from '@/lib/contracts';
import { Brand } from './site-brand';
import { LanguagePicker } from './language-picker';
import { InsuranceIllustration } from './insurance-illustration';

/** Authentication and return routes remain feature-owned. */
export function AuthScreen({ children, context }: { children: ReactNode; context?: ReactNode }) {
  const locale = useLocale();
  const path = usePathname();
  const router = useRouter();
  const t = useTranslations('authScreen');
  const common = useTranslations('common');

  function changeLanguage(next: Locale) {
    const parts = path.split('/');
    parts[1] = next;
    router.push(parts.join('/') + window.location.search + window.location.hash);
  }

  return <div className="auth-screen">
    <header className="auth-screen-header">
      <Link href={`/${locale}`} aria-label="Insurance Group"><Brand /></Link>
    </header>
    <div className="auth-screen-content">
      <section className="auth-screen-form">
        {context && <div className="auth-screen-context">{context}</div>}
        {children}
      </section>
      <aside className="auth-screen-aside" aria-labelledby="auth-screen-aside-title">
        <InsuranceIllustration name="travel" priority />
        <h2 id="auth-screen-aside-title">{t('accountTitle')}</h2>
        <p>{t('accountDescription')}</p>
      </aside>
    </div>
    <footer className="auth-screen-footer">
      <LanguagePicker showName onChange={changeLanguage} />
      <Link href={`/${locale}/help#privacy`}>{common('privacy')}</Link>
      <Link href={`/${locale}/help`}>{common('help')}</Link>
    </footer>
  </div>;
}
