'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Dialog } from '@base-ui/react/dialog';
import { Popover } from '@base-ui/react/popover';
import { ChevronDown, Menu as MenuIcon, UserRound, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type MouseEvent } from 'react';
import type { Locale } from '@/lib/contracts';
import { popoverFocusTarget } from '@/lib/popover-focus';
import { Brand } from './site-brand';
import { ProductDirectory } from './product-directory';
import { HeaderPreferences, MobileRegionalSettings } from './site-preferences';

export function PublicHeader() {
  const locale = useLocale(), path = usePathname(), router = useRouter();
  const h = useTranslations('homepage'), c = useTranslations('common');
  const [surface, setSurface] = useState<'insurance' | 'language' | 'currency' | 'mobile' | null>(null);
  const disclosureGroup = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const productsTrigger = useRef<HTMLButtonElement>(null);
  const productsPopup = useRef<HTMLDivElement>(null);
  const pendingSection = useRef<string | null>(null);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 901px)');
    const dismiss = () => setSurface(null);
    media.addEventListener('change', dismiss);
    return () => media.removeEventListener('change', dismiss);
  }, []);

  function changeSurface(target: NonNullable<typeof surface>, open: boolean) {
    if (target === 'mobile' && open) pendingSection.current = null;
    setSurface(current => open ? target : current === target ? null : current);
  }

  function navigationFocus() {
    if (pendingSection.current) return false;
    return window.matchMedia('(min-width: 901px)').matches ? productsTrigger.current : trigger.current;
  }
  function closeForSection(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    pendingSection.current = href.startsWith('#') ? href.slice(1) : null;
    setSurface(null);
  }
  function finishSectionNavigation(open: boolean) {
    const section = pendingSection.current;
    if (open || !section) return;
    // The modal's scroll lock must release before restoring an anchor destination.
    requestAnimationFrame(() => {
      if (pendingSection.current !== section) return;
      const target = document.getElementById(section);
      target?.scrollIntoView({ behavior: 'instant', block: 'start' });
      target?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    });
  }
  function changeLanguage(next: Locale) {
    const parts = path.split('/');
    parts[1] = next;
    setSurface(null);
    router.push(parts.join('/') + window.location.search + window.location.hash);
  }
  const workspaceHref = path === `/${locale}` ? '#manage' : `/${locale}#manage`;
  const experienceHref = path === `/${locale}` ? '#experience' : `/${locale}#experience`;

  return <header className="site-header public-header">
    <div className="container header-inner public-primary-row">
      <Link data-header-brand href={`/${locale}`} aria-label="Insurance Group"><Brand /></Link>
      <nav className="public-desktop-nav" aria-label={h('navigation')}>
        <Popover.Root open={surface === 'insurance'} onOpenChange={open => changeSurface('insurance', open)}>
          <Popover.Trigger ref={productsTrigger} className="public-nav-trigger">{h('insurance')}<ChevronDown size={14} aria-hidden="true" /></Popover.Trigger>
          <Popover.Portal><Popover.Positioner side="bottom" align="start" sideOffset={8} collisionPadding={16} positionMethod="fixed" className="products-panel-positioner">
            <Popover.Popup ref={productsPopup} className="products-panel" finalFocus={() => popoverFocusTarget(productsPopup.current, productsTrigger.current, trigger.current)}>
              <Popover.Title className="sr-only">{h('insurance')}</Popover.Title>
              <ProductDirectory placement="panel" onNavigate={() => setSurface(null)} />
            </Popover.Popup>
          </Popover.Positioner></Popover.Portal>
        </Popover.Root>
        <Link href={experienceHref}>{h('how')}</Link>
        <Link href={`/${locale}/help`} aria-current={path === `/${locale}/help` ? 'page' : undefined}>{c('help')}</Link>
      </nav>
      <div className="header-actions">
        <HeaderPreferences openPanel={surface === 'language' || surface === 'currency' ? surface : null} onPanelChange={changeSurface} onLanguageChange={changeLanguage} />
        <Link className="button header-account" href={`/${locale}/account`}><UserRound size={17} aria-hidden="true" />{c('myAccount')}</Link>
        <Dialog.Root open={surface === 'mobile'} onOpenChange={open => changeSurface('mobile', open)} onOpenChangeComplete={finishSectionNavigation}>
          <Dialog.Trigger ref={trigger} className="icon-button public-menu-toggle" aria-label={c('menu')}><MenuIcon size={22} aria-hidden="true" /></Dialog.Trigger>
          <Dialog.Portal><Dialog.Backdrop className="public-menu-backdrop" /><Dialog.Popup className="public-menu-popup public-discovery-menu" finalFocus={navigationFocus}>
            <div className="public-menu-heading"><Dialog.Title>{h('menuTitle')}</Dialog.Title><Dialog.Close className="icon-button" aria-label={c('close')}><X size={22} aria-hidden="true" /></Dialog.Close></div>
            <Dialog.Description className="sr-only">{h('menuDescription')}</Dialog.Description>
            <Link className="button public-menu-account" href={`/${locale}/account`} onClick={() => setSurface(null)}>{c('myAccount')}</Link>
            <details name={disclosureGroup} className="mobile-insurance">
              <summary>{h('insurance')}<ChevronDown size={18} aria-hidden="true" /></summary>
              <ProductDirectory placement="mobile" onNavigate={() => setSurface(null)} />
            </details>
            <nav className="public-mobile-links" aria-label={h('support')}>
              <Link href={experienceHref} onClick={event => closeForSection(event, experienceHref)}>{h('how')}</Link>
              <Link href={workspaceHref} onClick={event => closeForSection(event, workspaceHref)}>{h('policyServices')}</Link>
              <Link href={`/${locale}/help`} onClick={() => setSurface(null)} aria-current={path === `/${locale}/help` ? 'page' : undefined}>{c('help')}</Link>
            </nav>
            <MobileRegionalSettings disclosureGroup={disclosureGroup} onLanguageChange={changeLanguage} />
          </Dialog.Popup></Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  </header>;
}
