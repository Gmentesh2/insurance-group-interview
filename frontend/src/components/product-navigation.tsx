'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import type { Locale } from '@/lib/contracts';
import { DEFAULT_PRODUCT, isProductId, productIds, type ProductId } from '@/features/products/catalog';
import { productHref } from '@/features/products/navigation';
import { InsuranceIllustration } from './insurance-illustration';

type Props = {
  placement: 'panel' | 'mobile' | 'footer';
  onNavigate?: () => void;
};

function Items({ placement, onNavigate, preferences, selected = null }: Props & {
  preferences?: Pick<URLSearchParams, 'get'>;
  selected?: ProductId | null;
}) {
  const locale = useLocale() as Locale;
  const h = useTranslations('homepage'), p = useTranslations('products');
  const products = placement === 'footer' ? ['health', 'motor', 'home', 'travel'] as const : productIds;
  return products.map(product => {
    const current = selected === product;
    const href = productHref(locale, product, preferences);
    return <Link key={product} href={href} data-product={product} aria-current={current ? 'true' : undefined} onClick={onNavigate}>
      {placement !== 'footer' && <InsuranceIllustration name={product} thumbnail className="product-nav-art" />}
      <span className="product-nav-label"><span>{p(`${product}.title`)}</span>{placement !== 'footer' && (product === 'travel'
        ? <small className="product-nav-availability">{h('available')}</small>
        : <span className="sr-only"> {h('preview')}</span>)}</span>
      <span className="product-nav-marker" aria-hidden="true">{current && <Check size={16} />}</span>
    </Link>;
  });
}

function CurrentItems(props: Props) {
  const locale = useLocale();
  const path = usePathname();
  const params = useSearchParams();
  const homepage = path === `/${locale}`;
  const requested = homepage ? params.get('product') : null;
  const selected = homepage ? isProductId(requested) ? requested : DEFAULT_PRODUCT : null;
  return <Items {...props} preferences={homepage ? params : undefined} selected={selected} />;
}

/** Query-aware links must not suspend the surrounding static shell. */
export function ProductNavigationItems(props: Props) {
  return <Suspense fallback={<Items {...props} />}><CurrentItems {...props} /></Suspense>;
}
