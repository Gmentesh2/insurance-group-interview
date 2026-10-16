import { isoDate } from '@/lib/countries';
import { productFields, type ProductId } from './catalog';
export type ProductValues = Record<string, string>;
export type ProductErrors = Record<string, 'required' | 'range' | 'invalidDate' | 'dateOrder'>;
export function validateProductDetails(product: Exclude<ProductId, 'travel'>, values: ProductValues, today = isoDate(new Date())): ProductErrors {
  const errors: ProductErrors = {};
  for (const field of productFields[product]) {
    const value = values[field.key]?.trim();
    if (!value) { errors[field.key] = 'required'; continue; }
    if (field.kind === 'country' && !/^[A-Z]{2}$/.test(value)) errors[field.key] = 'required';
    if (field.kind === 'select' && !field.options?.includes(value)) errors[field.key] = 'required';
    if (field.kind === 'number' && (!Number.isFinite(Number(value)) || !Number.isInteger(Number(value)) || Number(value) < field.min! || Number(value) > field.max!)) errors[field.key] = 'range';
    if (field.kind === 'date') {
      const date = new Date(`${value}T00:00:00Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value || (field.key === 'purchaseDate' ? value > today : value < today)) errors[field.key] = 'invalidDate';
    }
  }
  if (!errors.startDate && !errors.endDate && values.startDate && values.endDate && values.endDate < values.startDate) errors.endDate = 'dateOrder';
  return errors;
}

/** Recheck dependent rental feedback; unrelated field errors stay visible. */
export function productErrorsAfterEdit(
  product: Exclude<ProductId, 'travel'>,
  values: ProductValues,
  errors: ProductErrors,
  field: string,
  today = isoDate(new Date()),
): ProductErrors {
  const next = { ...errors };
  delete next[field];
  if (field === 'startDate' && errors.endDate === 'dateOrder') {
    const endDateError = validateProductDetails(product, values, today).endDate;
    if (endDateError) next.endDate = endDateError;
    else delete next.endDate;
  }
  return next;
}
