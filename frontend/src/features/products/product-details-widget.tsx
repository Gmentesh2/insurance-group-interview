'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Pencil } from 'lucide-react';
import { CountryPicker } from '@/components/country-picker';
import { FlowProgress } from '@/components/flow-progress';
import { TravelQuoteLink } from '@/components/travel-quote-link';
import { ProductIcon } from '@/components/product-icon';
import { CountryFlag } from '@/components/country-flag';
import { DateInput } from '@/components/date-input';
import { FormSelect } from '@/components/form-select';
import { Input } from '@/components/ui';
import { FormField } from '@/components/form-field';
import { countryName } from '@/lib/countries';
import { productFields, type ProductId } from './catalog';
import { productErrorsAfterEdit, validateProductDetails, type ProductErrors, type ProductValues } from './validation';
import { productReviewHref } from './navigation';
import type { Locale } from '@/lib/contracts';

type PreviewProduct = Exclude<ProductId, 'travel'>;
// Public preferences only, in memory. No names, addresses, DOBs or medical details.
const drafts = new Map<PreviewProduct, { values: ProductValues; reviewed: boolean }>();

export function ProductDetailsWidget({ product, onTravel, entry = false }: { product: PreviewProduct; onTravel: () => void; entry?: boolean }) {
  const t = useTranslations('products');
  const h = useTranslations('homepage');
  const locale = useLocale() as Locale;
  const params = useSearchParams();
  const router = useRouter();
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const [values, setValues] = useState<ProductValues>(() => drafts.get(product)?.values ?? {});
  const [reviewed, setReviewed] = useState(() => !entry && (drafts.get(product)?.reviewed ?? false));
  const [errors, setErrors] = useState<ProductErrors>({});
  const fields = productFields[product];
  function update(key: string, value: string) {
    const next = { ...values, [key]: value };
    setValues(next);
    setErrors(current => productErrorsAfterEdit(product, next, current, key));
    drafts.set(product, { values: next, reviewed: false });
  }
  function review(event: FormEvent) {
    event.preventDefault();
    const invalid = validateProductDetails(product, values);
    setErrors(invalid);
    if (Object.keys(invalid).length) {
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    drafts.set(product, { values, reviewed: true });
    if (entry) {
      router.push(productReviewHref(locale, product, params));
      return;
    }
    setReviewed(true);
    requestAnimationFrame(() => heading.current?.focus());
  }
  function editDetails(key?: string) {
    setReviewed(false);
    drafts.set(product, { values, reviewed: false });
    requestAnimationFrame(() => form.current?.querySelector<HTMLElement>(key ? `[id="${id}-${key}"]` : 'input:not([type="hidden"]),select')?.focus());
  }
  function display(key: string) {
    const field = fields.find(item => item.key === key)!;
    if (field.kind === 'country') return countryName(values[key], locale);
    if (field.kind === 'select') return t(`options.${values[key]}`);
    if (field.kind === 'date') return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${values[key]}T00:00:00Z`));
    if (key === 'value') return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(values[key]));
    return new Intl.NumberFormat(locale, { useGrouping: key !== 'vehicleYear' }).format(Number(values[key]));
  }
  return <div className="product-details-widget" id="quote">
    <div className="product-widget-heading">{entry && <ProductIcon name={product} size={24} />}<div><h2 ref={heading} tabIndex={-1}>{t(reviewed ? 'reviewed' : entry ? `${product}.title` : 'details')}</h2></div><span className="product-preview-label">{h('preview')}</span></div>
    {!entry && <FlowProgress flow="productPreview" current={reviewed ? 1 : 0} onStep={reviewed ? () => editDetails() : undefined} canGoToStep={index => index === 0} />}
    {reviewed ? <>
      <dl className="product-preferences">{fields.map(field => <div key={field.key}>
        <dt>{t(`fields.${field.label ?? field.key}`)}</dt>
        <dd><span className="product-preference-value">{field.kind === 'country' && <CountryFlag code={values[field.key]} />}<span>{display(field.key)}</span></span>
          <button className="product-preference-edit" type="button" onClick={() => editDetails(field.key)} aria-label={t('editField', { field: t(`fields.${field.label ?? field.key}`) })} title={t('editField', { field: t(`fields.${field.label ?? field.key}`) })}><Pencil size={16} strokeWidth={1.7} aria-hidden="true" /></button>
        </dd>
      </div>)}</dl>
      <p className="product-availability" role="status">{t('unavailable')}{product === 'health' && <> {t('healthNext')}</>}</p>
      <TravelQuoteLink className="button" onTravel={onTravel}>{t('travelAction')}<ArrowRight size={18} aria-hidden="true" /></TravelQuoteLink>
      <button className="account-text-link" onClick={() => editDetails()}><ArrowLeft size={16} aria-hidden="true" />{t('edit')}</button>
    </> : <form ref={form} noValidate onSubmit={review}>
      <div className="product-preview-notice"><p>{h('previewNotice')}</p><TravelQuoteLink className="product-preview-travel" onTravel={onTravel}>{t('travelAction')}<ArrowRight size={16} aria-hidden="true" /></TravelQuoteLink></div>
      <p className="product-required-hint">{t('fieldsRequired')}</p>
      {fields.map(field => {
        const inputId = `${id}-${field.key}`;
        const hint = field.kind === 'date' ? t(field.key === 'purchaseDate' ? 'purchaseDateHint' : field.key === 'endDate' ? 'endDateHint' : 'startDateHint') : undefined;
        const error = errors[field.key] ? t(errors[field.key], { min: field.min ?? 0, max: field.max ?? 0 }) : undefined;
        return <FormField key={field.key} id={inputId} label={t(`fields.${field.label ?? field.key}`)} required hint={hint} error={error} className={field.span === 'half' ? 'product-field-half' : undefined}>
          {control => field.kind === 'country' ? <CountryPicker id={control.id} required={control.required} label={t(`fields.${field.label ?? field.key}`)} placeholder={t(`countryPlaceholders.${field.label ?? field.key}`)} name={field.key} value={values[field.key] ?? ''} invalid={control['aria-invalid']} describedBy={control['aria-describedby']} onChange={value => update(field.key, value)} />
            : field.kind === 'select' ? <FormSelect id={control.id} required={control.required} name={field.key} label={t(`fields.${field.label ?? field.key}`)} invalid={control['aria-invalid']} describedBy={control['aria-describedby']} value={values[field.key] ?? ''} placeholder={t(`placeholders.${field.key}`)} options={(field.options ?? []).map(option => ({ value: option, label: t(`options.${option}`) }))} onValueChange={value => update(field.key, value)} />
            : field.kind === 'date' ? <DateInput {...control} name={field.key} value={values[field.key] ?? ''} onValueChange={value => update(field.key, value)} />
            : <Input {...control} name={field.key} type="number" inputMode="numeric" min={field.min} max={field.max} step={1} value={values[field.key] ?? ''} onChange={event => update(field.key, event.target.value)} />}
        </FormField>;
      })}
      <button className="button" type="submit">{t('review')}<ArrowRight size={18} aria-hidden="true" /></button>
      <details className="product-quote-context"><summary>{t('beforeQuote')}</summary><p>{t(`${product}.checks`)}</p></details>
    </form>}
    {!entry && <p className="product-session-note">{t('sessionHint')}</p>}
  </div>;
}
