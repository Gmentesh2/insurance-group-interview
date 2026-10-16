"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, ArrowUp, ArrowUpRight, Menu, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import type { Locale } from "@/lib/contracts";
import { ProductIcon } from "./product-icon";
import { Brand } from "./site-brand";
import { PublicHeader } from "./public-navigation";
import { ProductNavigationItems } from "./product-navigation";
import { HeaderPreferences, MobileRegionalSettings, FooterPreferences } from "./site-preferences";

export function SiteHeader() {
  const locale = useLocale(), path = usePathname(), t = useTranslations("common");
  const compact = path.startsWith(`/${locale}/account`) || path.startsWith(`/${locale}/quotes/`) || path.startsWith(`/${locale}/checkout`) || path.startsWith(`/${locale}/products/`);
  return <><a href="#main" className="skip-link">{t("skip")}</a>{compact ? <CompactHeader /> : <PublicHeader />}</>;
}
function CompactHeader() {
  const locale = useLocale(), path = usePathname(), router = useRouter();
  const t = useTranslations("common"), h = useTranslations("homepage"), products = useTranslations("products"), platform = useTranslations("platformDesign");
  const account = useTranslations("account");
  const workspaceRoute = path.startsWith(`/${locale}/account`);
  const accountRoot = `/${locale}/account`;
  const claimDetail = path.startsWith(`${accountRoot}/claims/`);
  const backHref = path === accountRoot ? `/${locale}#products` : claimDetail ? `${accountRoot}/claims` : accountRoot;
  const backLabel = path === accountRoot ? h('backToProducts') : account(claimDetail ? 'backToClaims' : 'backToAccount');
  const shoppingRoute = path.startsWith(`/${locale}/quotes/`);
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 901px)');
    const dismiss = () => setOpen(false);
    media.addEventListener('change', dismiss);
    return () => media.removeEventListener('change', dismiss);
  }, []);
  function changeLanguage(next: Locale) {
    const parts = path.split('/');
    parts[1] = next;
    router.push(parts.join('/') + window.location.search + window.location.hash);
    setOpen(false);
  }
  const links = [
    { href: `/${locale}#products`, label: products('navigation'), icon: null },
    { href: `/${locale}/account`, label: t('policies'), icon: 'policies' as const },
    { href: `/${locale}/account/documents`, label: platform('documents'), icon: 'documents' as const },
    { href: `/${locale}/account/claims`, label: platform('claims'), icon: 'claims' as const },
    { href: `/${locale}/help`, label: t('help'), icon: null },
  ];
  return <header className={`site-header workspace-header ${workspaceRoute ? 'account-header' : 'transaction-header'}`}>
    <div className="container header-inner">
      <div className="header-brand-group">{workspaceRoute && <Link className="header-back" href={backHref} aria-label={backLabel} title={backLabel}><ArrowLeft size={20} aria-hidden="true" /></Link>}<Link href={`/${locale}`} aria-label="Insurance Group"><Brand /></Link></div>
      <nav className="desktop-navigation" aria-label={platform('navigation')}>
        {!workspaceRoute && <Link href={`/${locale}#products`}>{products('navigation')}</Link>}
        <Link href={`/${locale}/help`}>{t('help')}</Link>
      </nav>
      <div className="header-actions">
        <HeaderPreferences showCurrency={shoppingRoute} onLanguageChange={changeLanguage} />
        {!workspaceRoute && <Link className="button header-account" href={`/${locale}/account`}><UserRound size={17} aria-hidden="true" />{t('myAccount')}</Link>}
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger ref={trigger} className="icon-button mobile-menu-toggle" aria-label={t('menu')}><Menu size={22} aria-hidden="true" /></Dialog.Trigger>
          <Dialog.Portal><Dialog.Backdrop className="public-menu-backdrop" /><Dialog.Popup className="public-menu-popup" finalFocus={() => trigger.current?.getClientRects().length ? trigger.current : trigger.current?.closest('header')?.querySelector('a')}>
            <div className="public-menu-heading"><Dialog.Title>{h('menuTitle')}</Dialog.Title><Dialog.Close className="icon-button" aria-label={t('close')}><X size={22} aria-hidden="true" /></Dialog.Close></div>
            <Dialog.Description className="sr-only">{h('menuDescription')}</Dialog.Description>
            <nav className="public-mobile-links" aria-label={platform('navigation')}>
              {links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} aria-current={path === link.href ? 'page' : undefined}>{link.label}{link.icon ? <ProductIcon name={link.icon} size={20} /> : <ArrowUpRight size={18} aria-hidden="true" />}</Link>)}
            </nav>
            <MobileRegionalSettings showCurrency={shoppingRoute} onLanguageChange={changeLanguage} />
          </Dialog.Popup></Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  </header>;
}
export function SiteFooter() {
  const locale = useLocale(), t = useTranslations("common"), h = useTranslations("homepage"), platform = useTranslations("platformDesign"), path = usePathname();
  const router = useRouter();
  function changeLanguage(next: string) {
    const parts = path.split("/");
    parts[1] = next;
    router.push(parts.join("/") + window.location.search + window.location.hash);
  }
  if (path.startsWith(`/${locale}/account`) || path.startsWith(`/${locale}/quotes/`) || path.startsWith(`/${locale}/checkout`) || path.startsWith(`/${locale}/products/`)) return null;
  return <footer className="site-footer"><div className="container">
    <div className="footer-top">
      <div className="footer-brand"><Link href={`/${locale}`} aria-label="Insurance Group"><Brand /></Link><p className="footer-tagline">{h("footerDescription")}</p><Link className="footer-return" href={path === `/${locale}` ? "#products" : `/${locale}#products`}>{h("backToProducts")}<ArrowUp size={16} aria-hidden="true" /></Link></div>
      <nav className="footer-group" aria-label={h("insurance")}><h2>{h("insurance")}</h2><ProductNavigationItems placement="footer" /><Link href={path === `/${locale}` ? "#products" : `/${locale}#products`}>{h("all")}</Link></nav>
      <nav className="footer-group" aria-label={h("yourPolicies")}><h2>{h("yourPolicies")}</h2><Link href={`/${locale}/account`}>{t("policies")}</Link><Link href={`/${locale}/account/documents`}>{platform("documents")}</Link><Link href={`/${locale}/account/claims`}>{platform("claims")}</Link></nav>
      <nav className="footer-group" aria-label={h("support")}><h2>{h("support")}</h2><Link href={`/${locale}/help`}>{t("help")}</Link><Link href={path === `/${locale}` ? "#manage" : `/${locale}#manage`}>{h("policyTools")}</Link><Link href={path === `/${locale}` ? "#questions" : `/${locale}#questions`}>{h("questions")}</Link><Link href={`/${locale}/help#privacy`}>{t("privacy")}</Link></nav>
    </div>
    <div className="footer-bottom"><p>{t("footerNote")}</p><FooterPreferences onLanguageChange={changeLanguage} /></div>
    <div className="footer-legal"><span>© {new Date().getFullYear()} Insurance Group</span><Link href={`/${locale}/demo`}>{t("demoLab")}</Link></div>
  </div></footer>;
}
