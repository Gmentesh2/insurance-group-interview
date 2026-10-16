'use client';

import { useId, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Check } from 'lucide-react';
import { QuoteForm } from '@/components/quote-form';
import { productIds, type ProductId } from './catalog';
import { ProductDetailsWidget } from './product-details-widget';
import { ProductCardFace } from './product-card';
import { ProductArtwork } from './product-artwork';

type ChoiceProps = {
  product: ProductId;
  selected: boolean;
  reduced: boolean | null;
  onSelect: (product: ProductId) => void;
};
function ProductChoice({ product, selected, reduced, onSelect }: ChoiceProps) {
  const t = useTranslations('products');
  const h = useTranslations('homepage');
  const availabilityId = useId();
  return <motion.label
    tabIndex={-1}
    className={`product-choice ${selected ? 'product-choice-featured is-selected' : 'product-choice-compact'}`}
    layout={!reduced}
    whileHover={reduced || !selected ? undefined : { y: -2 }}
    whileTap={reduced ? undefined : { scale: 0.98 }}
    transition={{ duration: 0.16 }}
  >
    <input type="radio" name="insurance-product" value={product} checked={selected}
      aria-label={t(`${product}.title`)}
      aria-describedby={availabilityId}
      onChange={() => onSelect(product)}
      onKeyDown={event => {
        const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1
          : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
        if (!direction) return;
        event.preventDefault();
        // Visual promotion must not restart arrow navigation at the first item.
        const next = productIds[(productIds.indexOf(product) + direction + productIds.length) % productIds.length];
        const group = event.currentTarget.closest('fieldset');
        onSelect(next);
        requestAnimationFrame(() => group?.querySelector<HTMLInputElement>(`input[value="${next}"]`)?.focus({ preventScroll: true }));
      }} />
    {selected ? <ProductCardFace product={product} /> : <><ProductArtwork product={product} /><span className="product-choice-copy"><span className="product-choice-title">{t(`${product}.title`)}</span>{product === 'travel' && <small aria-hidden="true">{h('available')}</small>}</span></>}
    <span className="sr-only" id={availabilityId}>{t(`cardFocus.${product}`)}. {h(product === 'travel' ? 'available' : 'preview')}</span>
    <motion.span className="product-choice-check" aria-hidden="true" initial={false}
      animate={{ opacity: selected ? 1 : 0, scale: selected ? 1 : 0.7 }} transition={{ duration: reduced ? 0 : 0.16 }}>
      <Check size={13} />
    </motion.span>
  </motion.label>;
}

export function ProductDiscovery({ selected, onTravel }: { selected: ProductId; onTravel: () => void }) {
  const t = useTranslations('products');
  const widget = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const orderedProducts = [selected, ...productIds.filter(product => product !== selected)];
  function choose(product: ProductId) {
    if (product === selected) return;
    const url = new URL(window.location.href);
    url.searchParams.set('product', product);
    url.hash = 'products';
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }
  function continueToWidget() {
    const url = new URL(window.location.href);
    url.searchParams.set('product', selected);
    url.hash = 'quote';
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    widget.current?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
    widget.current?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
  }
  return <section className="hero container product-discovery" id="products">
    <div className="hero-copy">
      <h1>{t('heading')}</h1>
      <p className="hero-description">{t('introduction')}</p>
      <fieldset className="product-selector">
        <legend className="sr-only">{t('choose')}</legend>
        <div className="product-choices">
          {orderedProducts.map(product => <ProductChoice key={product} product={product} selected={selected === product} reduced={reduced} onSelect={choose} />)}
        </div>
      </fieldset>
      <p className="sr-only" role="status">{t('selected', { product: t(`${selected}.title`) })}</p>
      <button className="button product-continue" onClick={continueToWidget}>{t('continue', { product: t(`${selected}.title`) })}<ArrowRight size={18} aria-hidden="true" /></button>
    </div>
    <div className="hero-form-wrap product-widget-region" ref={widget} tabIndex={-1} aria-label={t(`${selected}.title`)}>
      <motion.div className="product-widget-surface" layout={reduced ? false : true} transition={{ duration: reduced ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }} aria-hidden="true" />
      <motion.div key={selected} initial={reduced ? false : { opacity: 0.9, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.18 }}>
        {selected === 'travel' ? <QuoteForm showProgress={false} /> : <ProductDetailsWidget product={selected} onTravel={onTravel} entry />}
      </motion.div>
    </div>
  </section>;
}
