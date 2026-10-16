'use client';

import { Menu } from '@base-ui/react/menu';
import { Check, ChevronDown } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@/lib/contracts';
import { useRef } from 'react';
import { popoverFocusTarget } from '@/lib/popover-focus';

const languages = [
  { locale: 'en', name: 'English' },
  { locale: 'de', name: 'Deutsch' },
  { locale: 'ru', name: 'Русский' },
] as const;

export function LanguagePicker({ onChange, showName = false, open, onOpenChange }: { onChange: (locale: Locale) => void; showName?: boolean; open?: boolean; onOpenChange?: (open: boolean) => void }) {
  const locale = useLocale();
  const t = useTranslations('common');
  const currentLanguage = languages.find(item => item.locale === locale);
  const trigger = useRef<HTMLButtonElement>(null), popup = useRef<HTMLDivElement>(null);
  return <Menu.Root modal={false} open={open} onOpenChange={onOpenChange}>
    <Menu.Trigger ref={trigger} className="language-trigger" aria-label={`${t('language')}: ${currentLanguage?.name}`}>
      <span lang={locale}>{showName ? currentLanguage?.name : locale.toUpperCase()}</span><ChevronDown size={14} aria-hidden="true" />
    </Menu.Trigger>
    <Menu.Portal>
      <Menu.Positioner align="end" sideOffset={8} positionMethod="fixed" collisionPadding={12} className="language-positioner">
        <Menu.Popup ref={popup} className="language-popup" aria-label={t('language')} finalFocus={() => popoverFocusTarget(popup.current, trigger.current, trigger.current?.closest('header')?.querySelector<HTMLAnchorElement>('[data-header-brand]') ?? trigger.current?.closest('header')?.querySelector('a') ?? null)}>
          <Menu.RadioGroup value={locale} onValueChange={(next: string) => {
            if (next === 'en' || next === 'de' || next === 'ru') onChange(next);
          }}>
            {languages.map(item => <Menu.RadioItem key={item.locale} value={item.locale} closeOnClick className="language-option">
              <span lang={item.locale}>{item.name}</span>
              <Menu.RadioItemIndicator><Check size={16} aria-hidden="true" /></Menu.RadioItemIndicator>
            </Menu.RadioItem>)}
          </Menu.RadioGroup>
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  </Menu.Root>;
}
