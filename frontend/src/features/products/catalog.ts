export const productIds = ['health', 'motor', 'home', 'travel', 'personal_accident', 'device', 'cyber', 'purchase_protection', 'rental_car'] as const;
export type ProductId = typeof productIds[number];
// Broad market-size priority, not a claim of worldwide policy-count rankings.
// Evidence and the limits of mapping property premiums to Home: docs/product-priority.md.
export const DEFAULT_PRODUCT: ProductId = 'health';
export const isProductId = (value: string | null): value is ProductId => productIds.some(id => id === value);
export type ProductField = {
  key: string;
  label?: string;
  span?: 'half';
  kind: 'country' | 'number' | 'date' | 'select';
  min?: number;
  max?: number;
  example?: number;
  options?: readonly string[];
};
const country: ProductField = { key: 'country', kind: 'country' };
const start: ProductField = { key: 'startDate', kind: 'date' };
const people: ProductField = { key: 'people', span: 'half', kind: 'number', min: 1, max: 8, example: 2 };
const age: ProductField = { key: 'age', span: 'half', kind: 'number', min: 0, max: 120, example: 35 };
const value: ProductField = { key: 'value', span: 'half', kind: 'number', min: 1, max: 10000000 };
/** Discovery schemas only. Product quote/provider contracts remain separate. */
export const productFields: Record<Exclude<ProductId, 'travel'>, readonly ProductField[]> = {
  health: [country, people, age, { key: 'period', span: 'half', kind: 'select', options: ['year', 'month'] }, { ...start, span: 'half' }],
  motor: [{ ...country, label: 'registrationCountry' }, { key: 'vehicleYear', span: 'half', kind: 'number', min: 1900, max: new Date().getUTCFullYear() + 1, example: 2022 }, { ...value, label: 'vehicleValue', example: 18000 }, { key: 'driverAge', span: 'half', kind: 'number', min: 18, max: 120, example: 35 }, { key: 'usage', span: 'half', kind: 'select', options: ['private', 'commute', 'business'] }],
  home: [{ ...country, label: 'propertyCountry' }, { key: 'propertyType', span: 'half', kind: 'select', options: ['apartment', 'house'] }, { key: 'occupancy', span: 'half', kind: 'select', options: ['owner', 'tenant'] }, { ...value, label: 'contentsValue', example: 30000 }, { ...start, span: 'half' }],
  device: [country, { key: 'deviceType', span: 'half', kind: 'select', options: ['phone', 'laptop', 'tablet'] }, { ...value, label: 'deviceValue', example: 900 }, { key: 'purchaseDate', kind: 'date' }],
  cyber: [country, { key: 'audience', span: 'half', kind: 'select', options: ['person', 'family'] }, { key: 'protection', span: 'half', kind: 'select', options: ['identity', 'fraud', 'devices'] }, start],
  purchase_protection: [country, { key: 'itemType', span: 'half', kind: 'select', options: ['electronics', 'other'] }, { ...value, label: 'purchaseValue', example: 250 }, { key: 'purchaseDate', kind: 'date' }],
  personal_accident: [country, people, age, { key: 'activity', span: 'half', kind: 'select', options: ['everyday', 'sport'] }, { ...start, span: 'half' }],
  rental_car: [{ ...country, label: 'rentalCountry' }, { ...start, label: 'rentalStarts', span: 'half' }, { key: 'endDate', span: 'half', kind: 'date' }, { ...value, label: 'rentalExcess', example: 1500 }],
};
