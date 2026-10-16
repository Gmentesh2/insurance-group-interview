'use client';

import { Menu } from '@base-ui/react/menu';
import { Check, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useRef } from 'react';
import { useCurrency } from './currency-provider';
import { Spinner } from './ui';
import { popoverFocusTarget } from '@/lib/popover-focus';

export function CurrencyPicker({ open, onOpenChange }: { open?: boolean; onOpenChange?: (open: boolean) => void } = {}) {
  const { currency, requestedCurrency, select, loading, failed, retry } = useCurrency();
  const t = useTranslations('currency'), noteId = useId();
  const trigger = useRef<HTMLButtonElement>(null), popup = useRef<HTMLDivElement>(null);
  const pending = requestedCurrency === 'USD' && loading;
  return <Menu.Root modal={false} open={open} onOpenChange={onOpenChange}>
    <Menu.Trigger ref={trigger} className="language-trigger currency-trigger" aria-label={`${t('title')}: ${currency}`} aria-busy={pending || undefined}><span translate="no">{currency}</span>{pending ? <Spinner /> : <ChevronDown size={14} aria-hidden="true" />}</Menu.Trigger>
    <Menu.Portal><Menu.Positioner align="end" sideOffset={8} positionMethod="fixed" collisionPadding={12} className="language-positioner currency-positioner">
      <Menu.Popup ref={popup} className="language-popup currency-popup" aria-label={t('title')} aria-describedby={noteId} finalFocus={() => popoverFocusTarget(popup.current, trigger.current, trigger.current?.closest('header')?.querySelector<HTMLAnchorElement>('[data-header-brand]') ?? trigger.current?.closest('header')?.querySelector('a') ?? null)}>
        <Menu.RadioGroup value={currency} onValueChange={next => { if (next === 'EUR' || next === 'USD') select(next); }}>
          {(['EUR', 'USD'] as const).map(code => <Menu.RadioItem key={code} value={code} closeOnClick={false} className="language-option"><span><strong>{code}</strong> {t(code)}</span><Menu.RadioItemIndicator><Check size={16} aria-hidden="true" /></Menu.RadioItemIndicator></Menu.RadioItem>)}
        </Menu.RadioGroup>
        <p id={noteId} className="currency-menu-note">{t('menuNote')}</p>
        {requestedCurrency === 'USD' && <div className="currency-menu-status" role="status">{loading ? t('loading') : failed ? <><p>{t('unavailable')}</p><button type="button" onClick={retry}>{t('retry')}</button></> : null}</div>}
      </Menu.Popup>
    </Menu.Positioner></Menu.Portal>
  </Menu.Root>;
}
