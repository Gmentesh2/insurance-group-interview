'use client';

import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'motion/react';
import type { ProductId } from './catalog';
import { ProductArtwork } from './product-artwork';

export function ProductCardFace({ product }: { product: ProductId }) {
  const t = useTranslations('products'), h = useTranslations('homepage');
  const reduced = useReducedMotion();
  return <span className="insurance-card-face" aria-hidden="true">
    <ProductArtwork product={product} featured />
    <motion.span layout={reduced ? false : 'position'} className="insurance-card-top"><span className="insurance-card-availability">{h(product === 'travel' ? 'available' : 'preview')}</span></motion.span>
    <motion.span layout={reduced ? false : 'position'} className="insurance-card-bottom"><span className="insurance-card-copy"><span className="insurance-card-title">{t(`${product}.title`)}</span><span className="insurance-card-focus">{t(`cardFocus.${product}`)}</span></span></motion.span>
  </span>;
}
