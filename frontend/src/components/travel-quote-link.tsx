'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import type { Locale } from '@/lib/contracts';
import { isProductPreviewPath, productHref } from '@/features/products/navigation';

/** Native destination and in-page activation share one public Travel entry. */
export function TravelQuoteLink({ onTravel, className, children }: {
  onTravel: () => void;
  className: string;
  children: ReactNode;
}) {
  const locale = useLocale() as Locale;
  const path = usePathname();
  const params = useSearchParams();
  const publicContext = path === `/${locale}` || isProductPreviewPath(path, locale);
  return <Link className={className} href={productHref(locale, 'travel', publicContext ? params : undefined, 'quote')} onClick={event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onTravel();
  }}>{children}</Link>;
}
