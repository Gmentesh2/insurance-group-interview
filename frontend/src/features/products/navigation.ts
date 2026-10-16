import type { Locale } from '@/lib/contracts';
import { isProductId, type ProductId } from './catalog';

type PublicPreferences = Pick<URLSearchParams, 'get'>;

function publicQuery(preferences?: PublicPreferences, product?: ProductId) {
  const query = new URLSearchParams(product ? { product } : undefined);
  if (preferences?.get('cover') === 'full') query.set('cover', 'full');
  const view = preferences?.get('view');
  if (view === 'documents' || view === 'claims') query.set('view', view);
  const language = preferences?.get('docLang');
  if (language === 'en' || language === 'de' || language === 'ru') query.set('docLang', language);
  return query;
}

/** Carry only recognized, non-private homepage display preferences to another product. */
export function productHref(locale: Locale, product: ProductId, preferences?: PublicPreferences, anchor: 'products' | 'quote' = 'products') {
  const query = publicQuery(preferences, product);
  return `/${locale}?${query}#${anchor}`;
}

/** Review carries display context only; questionnaire answers stay in memory. */
export function productReviewHref(locale: Locale, product: Exclude<ProductId, 'travel'>, preferences?: PublicPreferences) {
  const query = publicQuery(preferences).toString();
  return `/${locale}/products/${product}${query ? `?${query}` : ''}`;
}

export function isProductPreviewPath(path: string, locale: Locale) {
  const prefix = `/${locale}/products/`;
  if (!path.startsWith(prefix)) return false;
  const product = path.slice(prefix.length);
  return isProductId(product) && product !== 'travel';
}
