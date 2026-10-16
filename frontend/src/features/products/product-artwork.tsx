import { InsuranceIllustration } from '@/components/insurance-illustration';
import type { ProductId } from './catalog';

/** Matching local cutouts; native radio labels supply the product and availability. */
export function ProductArtwork({ product, featured = false }: { product: ProductId; featured?: boolean }) {
  return <span className={`product-artwork ${featured ? 'product-artwork-featured' : 'product-artwork-thumbnail'}`} aria-hidden="true"><InsuranceIllustration name={product} thumbnail={!featured} fill priority={featured} /></span>;
}
