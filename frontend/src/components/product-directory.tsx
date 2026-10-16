'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { ProductNavigationItems } from './product-navigation';

/** Compact native-link navigation; product selection stays on the landing page. */
export function ProductDirectory({ placement, onNavigate }: {
  placement: 'panel' | 'mobile';
  onNavigate: () => void;
}) {
  const h = useTranslations('homepage');
  const id = useId();
  return <nav className={`product-directory product-directory-${placement}`} aria-label={h('products')} aria-describedby={`${id}-note`}>
    <div className="product-directory-grid"><ProductNavigationItems placement={placement} onNavigate={onNavigate} /></div>
    <p className="product-directory-note" id={`${id}-note`}>{h('menuNote')}</p>
  </nav>;
}
