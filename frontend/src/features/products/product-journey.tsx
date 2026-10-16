'use client';

import { PageIdentity } from "@/components/insurance-illustration";
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import type { ProductId } from './catalog';
import { ProductDetailsWidget } from './product-details-widget';
import { productHref } from './navigation';
import type { Locale } from '@/lib/contracts';

/** Public preference review only; buying remains unavailable for these products. */
export function ProductJourney({ product }: { product: Exclude<ProductId, 'travel'> }) {
  const locale = useLocale() as Locale, router = useRouter(), params = useSearchParams();
  const t = useTranslations('products'), h = useTranslations('homepage');
  return <div className="container product-journey">
    <Link className="product-journey-back" href={productHref(locale, product, params)}><ArrowLeft size={16} aria-hidden="true" />{h('backToProducts')}</Link>
    <PageIdentity illustration={product}><h1>{t(`${product}.title`)}</h1></PageIdentity>
    <div className="product-journey-form"><ProductDetailsWidget key={product} product={product} onTravel={() => router.push(productHref(locale, 'travel', params, 'quote'))} /></div>
  </div>;
}
