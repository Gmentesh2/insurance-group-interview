'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Dialog } from '@base-ui/react/dialog';
import { LoaderCircle, MessageCircle, X } from 'lucide-react';

function ConversationLoading() {
  const t = useTranslations('assistant');
  return <p className="assistant-loading" role="status"><LoaderCircle size={18} className="spin" aria-hidden="true" />{t('checking')}</p>;
}

const Conversation = dynamic(() => import('./conversation').then(module => module.AssistantConversation), { ssr: false, loading: ConversationLoading });

function WidgetDialog() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('assistant');
  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger className="assistant-launcher" aria-label={t('action')}><MessageCircle size={21} aria-hidden="true" /><span>{t('launcher')}</span></Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Backdrop className="assistant-backdrop" />
      <Dialog.Popup className="assistant-popup">
        <header className="assistant-popup-header">
          <div><Dialog.Title>{t('title')}</Dialog.Title><Dialog.Description className="sr-only">{t('widgetIntro')} {t('widgetMemory')}</Dialog.Description></div>
          <Dialog.Close className="icon-button" aria-label={t('close')}><X size={21} aria-hidden="true" /></Dialog.Close>
        </header>
        <div className="assistant-popup-body">{open && <Conversation compact />}</div>
      </Dialog.Popup>
    </Dialog.Portal>
  </Dialog.Root>;
}

/** Navigation remounts the dialog, clearing messages and canceling in-flight requests. */
export function AssistantWidget() {
  const path = usePathname();
  const locale = useLocale();
  if (path === `/${locale}/assistant` || path.startsWith(`/${locale}/checkout`) || path === `/${locale}/ops`) return null;
  return <WidgetDialog key={path} />;
}
