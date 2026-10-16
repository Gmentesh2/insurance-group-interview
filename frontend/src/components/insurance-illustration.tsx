import Image from 'next/image';
import type { ReactNode } from 'react';
import type { ProductId } from '@/features/products/catalog';

export type IllustrationName = ProductId | 'documents' | 'claims' | 'support';

/** Decorative, locally hosted artwork. Visible labels remain real localized HTML. */
export function InsuranceIllustration({ name, thumbnail = false, fill = false, priority = false, className = '' }: {
  name: IllustrationName;
  thumbnail?: boolean;
  fill?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const workspace = name === 'documents' || name === 'claims' || name === 'support';
  return <Image
    className={`insurance-illustration ${className}`}
    src={`/images/illustrations/${workspace ? 'workspace' : 'products'}/${name}${thumbnail ? '-thumb' : ''}.webp`}
    alt="" aria-hidden="true" unoptimized
    {...(fill ? { fill: true, sizes: thumbnail ? '64px' : '360px' } : { width: thumbnail ? 180 : 720, height: thumbnail ? 120 : 480 })}
    loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined}
  />;
}

/** The feature owns its heading, description and focus target. */
export function PageIdentity({ illustration, children }: { illustration: IllustrationName; children: ReactNode }) {
  return <div className="page-identity"><InsuranceIllustration name={illustration} thumbnail /><div className="page-identity-copy">{children}</div></div>;
}
