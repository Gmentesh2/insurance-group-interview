'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/lib/contracts';

/** Presentation only: callers own the public or private language preference. */
export function DocumentLanguage({ value, onChange }: {
  value: Locale;
  onChange: (language: Locale) => void;
}) {
  const t = useTranslations('workspaceDesign');
  const id = useId();
  return <label className="documents-language" htmlFor={id}>
    <span>{t('languageShort')}</span>
    <select id={id} value={value} onChange={event => {
      const language = event.target.value;
      if (language === 'en' || language === 'de' || language === 'ru') onChange(language);
    }}>
      <option value="en">{t('english')}</option>
      <option value="de">{t('german')}</option>
      <option value="ru">{t('russian')}</option>
    </select>
  </label>;
}
