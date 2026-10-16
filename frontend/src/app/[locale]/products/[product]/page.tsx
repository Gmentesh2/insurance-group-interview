import { notFound, redirect } from 'next/navigation';
import { isProductId } from '@/features/products/catalog';
import { ProductJourney } from '@/features/products/product-journey';

export default async function Page({ params }: { params: Promise<{ locale: string; product: string }> }) {
  const { locale, product } = await params;
  if (!isProductId(product)) notFound();
  if (product === 'travel') redirect(`/${locale}?product=travel#quote`);
  return <ProductJourney product={product} />;
}
