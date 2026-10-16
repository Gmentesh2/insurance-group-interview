'use client';

import { useEffect, useId, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, ChevronDown, Globe2 } from 'lucide-react';
import type { Locale } from '@/lib/contracts';
import { LanguagePicker } from './language-picker';
import { CurrencyPicker } from './currency-picker';

type LanguageChange = { onLanguageChange: (locale: Locale) => void };
type PreferencePanel = 'language' | 'currency';
type HeaderPreferenceProps = LanguageChange & { showCurrency?: boolean } & (
  { openPanel: PreferencePanel | null; onPanelChange: (panel: PreferencePanel, open: boolean) => void } |
  { openPanel?: never; onPanelChange?: never }
);
const languages = [
  { locale: 'en', name: 'English' },
  { locale: 'de', name: 'Deutsch' },
  { locale: 'ru', name: 'Русский' },
] as const;

/** One menu per preference, with shared ownership of desktop open state. */
export function HeaderPreferences({ onLanguageChange, showCurrency = true, openPanel, onPanelChange }: HeaderPreferenceProps) {
  const [internalPanel, setInternalPanel] = useState<PreferencePanel | null>(null);
  const panel = openPanel === undefined ? internalPanel : openPanel;
  useEffect(() => {
    const media = window.matchMedia('(min-width: 901px)');
    const dismiss = () => setInternalPanel(null);
    media.addEventListener('change', dismiss);
    return () => media.removeEventListener('change', dismiss);
  }, []);
  function changePanel(target: PreferencePanel, open: boolean) {
    if (onPanelChange) onPanelChange(target, open);
    else setInternalPanel(current => open ? target : current === target ? null : current);
  }
  return <div className="header-preferences">
    <LanguagePicker showName onChange={onLanguageChange} open={panel === 'language'} onOpenChange={open => changePanel('language', open)} />
    {showCurrency && <CurrencyPicker open={panel === 'currency'} onOpenChange={open => changePanel('currency', open)} />}
  </div>;
}

/** Native language choices avoid another popup inside the mobile drawer. */
export function MobileRegionalSettings({ disclosureGroup, showCurrency = true, onLanguageChange }: LanguageChange & { disclosureGroup?: string; showCurrency?: boolean }) {
  const locale = useLocale(), h = useTranslations('homepage'), t = useTranslations('currency');
  const id = useId();
  return <>
    <details name={disclosureGroup} className="mobile-regional-settings">
      <summary><Globe2 size={18} aria-hidden="true" /><span className="sr-only">{h('language')}: </span><span lang={locale}>{languages.find(language => language.locale === locale)?.name}</span><ChevronDown size={16} aria-hidden="true" /></summary>
      <fieldset className="preference-choices preference-languages"><legend className="sr-only">{h('language')}</legend>
        {languages.map(language => <label key={language.locale}><input type="radio" name={`${id}-language`} checked={locale === language.locale} onChange={() => onLanguageChange(language.locale)} /><span lang={language.locale}>{language.name}</span>{locale === language.locale && <Check size={14} aria-hidden="true" />}</label>)}
      </fieldset>
    </details>
    {showCurrency && <div className="mobile-currency-choice"><span>{t('title')}</span><CurrencyPicker /></div>}
  </>;
}

export function FooterPreferences({ onLanguageChange }: LanguageChange) {
  const h = useTranslations('homepage'), t = useTranslations('currency');
  return <div className="footer-preferences"><div><span>{t('title')}</span><CurrencyPicker /></div><div><span>{h('language')}</span><LanguagePicker onChange={onLanguageChange} showName /></div></div>;
}
