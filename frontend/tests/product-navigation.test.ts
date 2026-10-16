import { describe, expect, it } from 'vitest';
import { isProductPreviewPath, productHref, productReviewHref } from '@/features/products/navigation';

describe('public product navigation', () => {
  it('retains explored sections while replacing the category and target', () => {
    const source = new URLSearchParams('product=motor&cover=full&view=documents&docLang=ru');
    expect(productHref('de', 'home', source)).toBe('/de?product=home&cover=full&view=documents&docLang=ru#products');
    expect(source.get('product')).toBe('motor');
  });

  it('does not copy unrecognized or private query values into public links', () => {
    const source = new URLSearchParams('view=claims&docLang=en&email=fictional%40example.invalid&token=private-example&order=123&cover=invalid');
    expect(productHref('en', 'travel', source)).toBe('/en?product=travel&view=claims&docLang=en#products');
  });

  it('falls back to a clean product link without valid public preferences', () => {
    expect(productHref('ru', 'health', new URLSearchParams('view=invalid&docLang=invalid&cover=invalid'))).toBe('/ru?product=health#products');
    expect(productHref('en', 'motor')).toBe('/en?product=motor#products');
  });

  it('keeps the same safe preferences for a direct quote-form destination', () => {
    const source = new URLSearchParams('product=home&cover=full&view=claims&docLang=de&token=private-example');
    expect(productHref('ru', 'travel', source, 'quote')).toBe('/ru?product=travel&cover=full&view=claims&docLang=de#quote');
  });

  it('retains display context through preference review and return to selection', () => {
    const source = new URLSearchParams('product=health&cover=full&view=documents&docLang=ru');
    const review = productReviewHref('de', 'health', source);
    expect(review).toBe('/de/products/health?cover=full&view=documents&docLang=ru');
    expect(productHref('de', 'health', new URL(review, 'https://example.invalid').searchParams)).toBe('/de?product=health&cover=full&view=documents&docLang=ru#products');
  });

  it('never sends questionnaire answers or arbitrary return destinations to review URLs', () => {
    const source = new URLSearchParams('view=claims&country=DE&age=35&startDate=2026-10-22&value=30000&returnTo=https://example.invalid&token=private-example');
    expect(productReviewHref('en', 'home', source)).toBe('/en/products/home?view=claims');
    expect(productReviewHref('ru', 'motor', new URLSearchParams('cover=invalid&docLang=invalid'))).toBe('/ru/products/motor');
  });

  it('recognizes only exact localized preview routes as public product context', () => {
    expect(isProductPreviewPath('/de/products/health', 'de')).toBe(true);
    for (const path of ['/en/products/health', '/de/products/health/extra', '/de/products/travel', '/de/products/invalid', '/de/account', '/de/help']) {
      expect(isProductPreviewPath(path, 'de')).toBe(false);
    }
  });
});
