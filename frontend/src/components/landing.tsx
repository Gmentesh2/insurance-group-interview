'use client';

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { useSearchParams } from 'next/navigation';
import { useReducedMotion } from 'motion/react';
import { ProductDiscovery } from '@/features/products/product-discovery';
import { DEFAULT_PRODUCT, isProductId } from '@/features/products/catalog';
import { HomepageSections } from '@/features/homepage/sections';
import type { HomepageExample } from '@/features/homepage/contracts';

function subscribeHash(change: () => void) {
  window.addEventListener('hashchange', change);
  window.addEventListener('popstate', change);
  return () => {
    window.removeEventListener('hashchange', change);
    window.removeEventListener('popstate', change);
  };
}
export function Landing({ example }: { example: HomepageExample }) {
  const params = useSearchParams();
  const product = params.get('product');
  const root = useRef<HTMLDivElement>(null);
  const pendingQuoteFocus = useRef(false);
  const reduced = useReducedMotion();
  const quoteAnchor = useSyncExternalStore(subscribeHash, () => window.location.hash === '#quote', () => false);
  const selected = isProductId(product) ? product : (quoteAnchor ? 'travel' : DEFAULT_PRODUCT);
  useEffect(() => {
    if (isProductId(product) || !quoteAnchor) return;
    // Resolve a legacy hash once, before other section links replace that hash.
    const url = new URL(window.location.href);
    url.searchParams.set('product', 'travel');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }, [product, quoteAnchor]);
  const focusQuote = useCallback(() => {
    const widget = root.current?.querySelector<HTMLElement>('#quote');
    widget?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
    widget?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  }, [reduced]);
  useEffect(() => {
    if (!pendingQuoteFocus.current) return;
    pendingQuoteFocus.current = false;
    if (selected === 'travel') focusQuote();
  }, [selected, params, focusQuote]);
  function openTravel() {
    // Wait for the selected widget to commit before focusing its replacement heading.
    pendingQuoteFocus.current = selected !== 'travel';
    const url = new URL(window.location.href);
    url.searchParams.set('product', 'travel');
    url.hash = 'quote';
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    if (selected === 'travel') focusQuote();
  }
  return <div className="landing-page" ref={root}>
    <ProductDiscovery selected={selected} onTravel={openTravel} />
    <HomepageSections example={example} onTravel={openTravel} />
  </div>;
}
