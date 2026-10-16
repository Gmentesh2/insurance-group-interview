'use client';

import { useLocale, useTranslations } from 'next-intl';
import { PageIdentity } from './insurance-illustration';
import { AssistantConversation } from '@/features/assistant/conversation';

export function AssistantPage() {
  const t = useTranslations('assistant');
  const locale = useLocale();
  return <div className="container page-space assistant-page">
    <PageIdentity illustration="support"><h1>{t('title')}</h1><p>{t('intro')}</p></PageIdentity>
    <AssistantConversation key={locale} />
  </div>;
}
