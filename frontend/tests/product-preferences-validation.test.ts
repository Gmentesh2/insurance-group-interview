import { expect, it } from 'vitest';
import { productErrorsAfterEdit, validateProductDetails } from '../src/features/products/validation';

const rental = { country: 'DE', startDate: '2026-10-20', endDate: '2026-10-23', value: '1500' };
const today = '2026-10-16';

it('asks for a valid rental date before comparing the rental period', () => {
  for (const endDate of ['1', '2026-02-30', '2026-10-15']) {
    expect(validateProductDetails('rental_car', { ...rental, endDate }, today).endDate).toBe('invalidDate');
  }
  const invalidStart = validateProductDetails('rental_car', { ...rental, startDate: '99/99/2026' }, today);
  expect(invalidStart.startDate).toBe('invalidDate');
  expect(invalidStart.endDate).toBeUndefined();
});

it('compares valid rental dates and accepts a same-day rental', () => {
  expect(validateProductDetails('rental_car', { ...rental, endDate: '2026-10-19' }, today).endDate).toBe('dateOrder');
  expect(validateProductDetails('rental_car', { ...rental, endDate: rental.startDate }, today)).toEqual({});
});

it('removes an obsolete rental-period error after correcting the start date', () => {
  const corrected = { ...rental, startDate: '2026-10-22', endDate: '2026-10-23' };
  expect(productErrorsAfterEdit('rental_car', corrected, { endDate: 'dateOrder', value: 'range' }, 'startDate', today)).toEqual({ value: 'range' });
});

it('keeps relevant feedback on other rental fields during editing', () => {
  const reversed = { ...rental, startDate: '2026-10-24' };
  expect(productErrorsAfterEdit('rental_car', reversed, { endDate: 'dateOrder' }, 'startDate', today)).toEqual({ endDate: 'dateOrder' });
  expect(productErrorsAfterEdit('rental_car', rental, { endDate: 'invalidDate' }, 'startDate', today)).toEqual({ endDate: 'invalidDate' });
  expect(productErrorsAfterEdit('rental_car', reversed, { endDate: 'dateOrder', value: 'range' }, 'value', today)).toEqual({ endDate: 'dateOrder' });
});
